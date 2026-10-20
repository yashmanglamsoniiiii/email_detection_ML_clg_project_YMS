import os, json

MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'server', 'model', 'model.json')

def main():
    if not os.path.exists(MODEL_PATH):
        print('Error: model.json not found.')
        return
    with open(MODEL_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)

    print('=' * 65)
    print('  EMAIL & SMS SPAM DETECTION - MODEL EVALUATION REPORT')
    print('=' * 65)
    stats = data.get('datasetStats', {})
    total = stats.get('totalSamples', 0)
    ham = stats.get('hamSamples', 0)
    spam = stats.get('spamSamples', 0)
    print(f'Total Dataset Size: {total:,} records')
    print(f'  - Ham (Legitimate): {ham:,}')
    print(f'  - Spam: {spam:,}')
    print('  - Dataset Sources:')
    for src, count in stats.get('sources', {}).items():
        print(f'     * {src}: {count:,}')

    sep = '-' * 65
    print(chr(10) + sep)
    print('MODEL COMPARISON & METRICS ON TEST SPLIT (20% Holdout):')
    print(sep)
    metrics = data.get('metrics', {})
    for name, m in metrics.items():
        print(f'{chr(10)}Model: {name.upper()}')
        print(f'  * Accuracy : {m["accuracy"]*100:.2f}%')
        print(f'  * Precision: {m["precision"]*100:.2f}%')
        print(f'  * Recall   : {m["recall"]*100:.2f}%')
        print(f'  * F1-Score : {m["f1"]*100:.2f}%')
        cm = m.get('confusionMatrix', [[0, 0], [0, 0]])
        print(f'  * Confusion Matrix: [TN: {cm[0][0]}, FP: {cm[0][1]}]')
        print(f'                      [FN: {cm[1][0]}, TP: {cm[1][1]}]')

    print(chr(10) + sep)
    print('TOP 15 INFLUENTIAL SPAM SIGNALS:')
    for item in data.get('topSpamWords', [])[:15]:
        print(f'  [+] {item["word"]:<20} (weight: {item["weight"]})')

    print(chr(10) + 'TOP 15 INFLUENTIAL HAM SIGNALS:')
    for item in data.get('topHamWords', [])[:15]:
        print(f'  [-] {item["word"]:<20} (weight: {item["weight"]})')
    print('=' * 65)

if __name__ == '__main__':
    main()
