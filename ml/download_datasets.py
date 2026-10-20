import os, ssl, urllib.request, pandas as pd

DATASETS_DIR = os.path.join(os.path.dirname(__file__), 'datasets')
os.makedirs(DATASETS_DIR, exist_ok=True)

SSL_CONTEXT = ssl.create_default_context()
SSL_CONTEXT.check_hostname = False
SSL_CONTEXT.verify_mode = ssl.CERT_NONE
HEADERS = {'User-Agent': 'Mozilla/5.0'}

def download_file(url, dest_path):
    print(f'Downloading from {url}...')
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=30, context=SSL_CONTEXT) as response:
            with open(dest_path, 'wb') as f:
                f.write(response.read())
        print(f'  -> Saved {dest_path} ({os.path.getsize(dest_path):,} bytes)')
        return True
    except Exception as e:
        print(f'  -> Error downloading {url}: {e}')
        return False

def load_sms():
    sms_path = os.path.join(DATASETS_DIR, 'sms_spam.tsv')
    url = 'https://raw.githubusercontent.com/justmarkham/pycon-2016-tutorial/master/data/sms.tsv'
    if not os.path.exists(sms_path):
        download_file(url, sms_path)
    df = pd.read_csv(sms_path, sep='\t', header=None, names=['label', 'text'], quoting=3, on_bad_lines='skip')
    df['label'] = df['label'].astype(str).str.strip().str.lower().map({'ham': 'ham', 'spam': 'spam'})
    df['source'] = 'SMS_Collection'
    df = df.dropna(subset=['label', 'text'])
    print(f'Loaded SMS: {len(df):,} rows')
    return df

def load_enron():
    enron_path = os.path.join(DATASETS_DIR, 'enron_spam.csv')
    url = 'https://raw.githubusercontent.com/kairess/toy-datasets/master/spam_ham_dataset.csv'
    if not os.path.exists(enron_path):
        download_file(url, enron_path)
    df = pd.read_csv(enron_path, on_bad_lines='skip')
    if 'label' in df.columns:
        df['label'] = df['label'].astype(str).str.strip().str.lower()
    elif 'label_num' in df.columns:
        df['label'] = df['label_num'].map({0: 'ham', 1: 'spam'})
    df['source'] = 'Enron'
    df = df[['label', 'text', 'source']].dropna(subset=['label', 'text'])
    print(f'Loaded Enron: {len(df):,} rows')
    return df

def load_spamassassin():
    sa_path = os.path.join(DATASETS_DIR, 'spam_assassin.csv')
    url = 'https://raw.githubusercontent.com/chloeoxe/spam-email-detector/master/completeSpamAssassin.csv'
    if not os.path.exists(sa_path):
        download_file(url, sa_path)
    df = pd.read_csv(sa_path, on_bad_lines='skip')
    label_col = 'Label' if 'Label' in df.columns else ('label' if 'label' in df.columns else None)
    text_col = 'Body' if 'Body' in df.columns else ('text' if 'text' in df.columns else None)
    if label_col and text_col:
        df = df.rename(columns={label_col: 'label_num', text_col: 'text'})
        df['label'] = df['label_num'].astype(str).str.strip().map({'0': 'ham', '1': 'spam', '0.0': 'ham', '1.0': 'spam'})
        df['source'] = 'SpamAssassin'
        df = df[['label', 'text', 'source']].dropna(subset=['label', 'text'])
        print(f'Loaded SpamAssassin: {len(df):,} rows')
        return df
    return pd.DataFrame(columns=['label', 'text', 'source'])

def main():
    print('Downloading and compiling datasets...')
    dfs = [load_sms(), load_enron(), load_spamassassin()]
    combined = pd.concat(dfs, ignore_index=True)
    combined['text'] = combined['text'].astype(str).str.strip()
    combined = combined[combined['text'].str.len() > 3]
    combined = combined.drop_duplicates(subset=['text'])
    out_csv = os.path.join(DATASETS_DIR, 'combined_dataset.csv')
    combined.to_csv(out_csv, index=False, encoding='utf-8')
    print('Finished! Total samples:', len(combined))
    print(combined['label'].value_counts().to_dict())

if __name__ == '__main__':
    main()
