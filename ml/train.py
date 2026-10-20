import os, re, json, datetime
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix

DATASETS_DIR = os.path.join(os.path.dirname(__file__), 'datasets')
MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'server', 'model')
os.makedirs(MODEL_DIR, exist_ok=True)

def clean_text(text: str) -> str:
    if not isinstance(text, str):
        return ''
    text = text.lower()
    text = re.sub(r'<[^>]+>', ' ', text)
    text = re.sub(r'(https?://\S+|www\.\S+)', ' <URL> ', text)
    text = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', ' <EMAIL> ', text)
    text = re.sub(r'[$€£¥₹]', ' <CURRENCY> ', text)
    text = re.sub(r'\b\d{4,}\b', ' <NUMBER> ', text)
    text = re.sub(r'[^a-z0-9<>]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def main():
    print('=' * 60)
    print('TRAINING SPAM CLASSIFIER MODEL')
    print('=' * 60)

    csv_path = os.path.join(DATASETS_DIR, 'combined_dataset.csv')
    df = pd.read_csv(csv_path)

    df['clean_text'] = df['text'].apply(clean_text)
    df = df[df['clean_text'].str.len() > 2]
    df['target'] = (df['label'] == 'spam').astype(int)

    X_train_raw, X_test_raw, y_train, y_test = train_test_split(
        df['clean_text'], df['target'], test_size=0.20, random_state=42, stratify=df['target']
    )

    vectorizer = TfidfVectorizer(
        max_features=8000,
        ngram_range=(1, 2),
        sublinear_tf=True,
        min_df=2
    )
    X_train = vectorizer.fit_transform(X_train_raw)
    X_test = vectorizer.transform(X_test_raw)

    print(f'Vocabulary size: {len(vectorizer.vocabulary_):,} features')

    # 1. Train Multinomial Naive Bayes
    nb = MultinomialNB(alpha=0.1)
    nb.fit(X_train, y_train)
    y_pred_nb = nb.predict(X_test)

    nb_acc = float(accuracy_score(y_test, y_pred_nb))
    nb_prec = float(precision_score(y_test, y_pred_nb))
    nb_rec = float(recall_score(y_test, y_pred_nb))
    nb_f1 = float(f1_score(y_test, y_pred_nb))
    nb_cm = confusion_matrix(y_test, y_pred_nb).tolist()

    # 2. Train Logistic Regression
    lr = LogisticRegression(C=2.0, max_iter=1000)
    lr.fit(X_train, y_train)
    y_pred_lr = lr.predict(X_test)

    lr_acc = float(accuracy_score(y_test, y_pred_lr))
    lr_prec = float(precision_score(y_test, y_pred_lr))
    lr_rec = float(recall_score(y_test, y_pred_lr))
    lr_f1 = float(f1_score(y_test, y_pred_lr))
    lr_cm = confusion_matrix(y_test, y_pred_lr).tolist()

    print(f'  Naive Bayes  -> Acc: {nb_acc*100:.2f}%, Prec: {nb_prec*100:.2f}%, Rec: {nb_rec*100:.2f}%, F1: {nb_f1*100:.2f}%')
    print(f'  Logistic Reg -> Acc: {lr_acc*100:.2f}%, Prec: {lr_prec*100:.2f}%, Rec: {lr_rec*100:.2f}%, F1: {lr_f1*100:.2f}%')

    feature_names = vectorizer.get_feature_names_out()
    lr_coefs = lr.coef_[0]
    top_spam_indices = np.argsort(lr_coefs)[-35:][::-1]
    top_ham_indices = np.argsort(lr_coefs)[:35]

    top_spam_words = [{'word': feature_names[i], 'weight': round(float(lr_coefs[i]), 3)} for i in top_spam_indices]
    top_ham_words = [{'word': feature_names[i], 'weight': round(float(lr_coefs[i]), 3)} for i in top_ham_indices]

    model_export = {
        'modelType': 'LogisticRegression+MultinomialNB',
        'activeModel': 'logisticRegression',
        'createdAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'datasetStats': {
            'totalSamples': int(len(df)),
            'hamSamples': int((df['target'] == 0).sum()),
            'spamSamples': int((df['target'] == 1).sum()),
            'sources': df['source'].value_counts().to_dict() if 'source' in df.columns else {}
        },
        'metrics': {
            'logisticRegression': {
                'accuracy': round(lr_acc, 4),
                'precision': round(lr_prec, 4),
                'recall': round(lr_rec, 4),
                'f1': round(lr_f1, 4),
                'confusionMatrix': lr_cm
            },
            'naiveBayes': {
                'accuracy': round(nb_acc, 4),
                'precision': round(nb_prec, 4),
                'recall': round(nb_rec, 4),
                'f1': round(nb_f1, 4),
                'confusionMatrix': nb_cm
            }
        },
        'classes': ['ham', 'spam'],
        'vocabulary': {word: int(idx) for word, idx in vectorizer.vocabulary_.items()},
        'idf': [float(x) for x in vectorizer.idf_],
        'logisticRegression': {
            'intercept': float(lr.intercept_[0]),
            'coef': [float(x) for x in lr.coef_[0]]
        },
        'naiveBayes': {
            'classLogPrior': [float(x) for x in nb.class_log_prior_],
            'featureLogProb': [
                [float(x) for x in nb.feature_log_prob_[0]],
                [float(x) for x in nb.feature_log_prob_[1]]
            ]
        },
        'topSpamWords': top_spam_words,
        'topHamWords': top_ham_words
    }

    out_json = os.path.join(MODEL_DIR, 'model.json')
    with open(out_json, 'w', encoding='utf-8') as f:
        json.dump(model_export, f, indent=2)

    print(f'Exported full dual-model weights to: {out_json} ({os.path.getsize(out_json):,} bytes)')
    print('=' * 60)

if __name__ == '__main__':
    main()
