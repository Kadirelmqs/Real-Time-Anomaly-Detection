# Gerçek Zamanlı Ağ Anomali Tespiti ve Görselleştirilmesi

Bu proje, Sivas Cumhuriyet Üniversitesi Bilgisayar Mühendisliği Bölümü bitirme projesi kapsamında geliştirilmiştir. Canlı ağ trafiğini dinleyerek, makine öğrenmesi teknikleri kullanılarak anormal aktivitelerin gerçek zamanlı olarak tespit edilmesini ve sonuçların interaktif bir web arayüzünde görselleştirilmesini amaçlamaktadır.

## Temel Özellikler

- **Canlı Paket Yakalama:** `scapy` kütüphanesi ile ağ trafiğinin anlık olarak yakalanması ve akış (flow) bazlı analizi.
- **Makine Öğrenmesi Tabanlı Tespit:** UNSW-NB15 veri seti ve yerel ağ verisi ile eğitilmiş Random Forest modeli (`v4`) kullanarak anomali tespiti.
- **Gerçek Zamanlı Arayüz:** `Flask` ve `Server-Sent Events (SSE)` ile geliştirilmiş, tespit sonuçlarını anlık olarak gösteren modern bir web paneli.
- **Dinamik Görselleştirme:** `Chart.js` kullanılarak anomali ve normal trafik dağılımının canlı grafiklerle sunulması.
- **Akıllı Açıklama:** Tespit edilen anomaliler için, modelin kararına etki eden olası nedenlerin sunulması.

## Kurulum

1.  Bu depoyu (repository) klonlayın:
    ```bash
    git clone [PROJENİZİN_GITHUB_LINKİ]
    cd [PROJE_KLASÖRÜNÜZ]
    ```
2.  Bir sanal Python ortamı oluşturun ve aktive edin:
    ```bash
    python -m venv venv
    # Windows için:
    .\venv\Scripts\activate
    # Linux/macOS için:
    source venv/bin/activate
    ```
3.  Gerekli kütüphaneleri `requirements.txt` dosyasından yükleyin:
    ```bash
    pip install -r requirements.txt
    ```
4.  **Model Dosyalarını İndirme:** Bu projenin kullandığı eğitilmiş model dosyaları (`.pkl`) büyük boyutları nedeniyle depoya dahil edilmemiştir. Lütfen aşağıdaki linkten `unsw_rf_model_v4.pkl` dosyasını indirin ve projenizdeki `models` klasörünün içine yerleştirin.
    
    **[Model İndirme Linki: https://drive.google.com/drive/folders/1o5bWCYb93EguAER6Sfc3feQe0Hdu5bxO?usp=sharing]**

## Kullanım

Uygulamayı çalıştırmak için **Yönetici (Administrator/root)** yetkilerine sahip bir terminal kullanmanız gerekmektedir.

```bash
# Windows: Yönetici olarak açılmış bir PowerShell veya CMD'de çalıştırın
# Linux/macOS: Komutun başına 'sudo' ekleyin
python app.py

## Proje Yapısı

    .
    ├── app.py                # Ana Flask uygulaması ve SSE sunucusu
    ├── saldiri_test.py       # Anomali testi için saldırı script'i
    ├── veri_toplayici.py     # Canlı veri kaydetme script'i
    ├── models/
    │   └── unsw_rf_model_v4.pkl  # (Harici olarak(google drive'dan) indirilip bu klasöre konulacak)
    ├── static/
    │   ├── css/style.css
    │   └── js/main.js
    ├── templates/
    │   └── index.html
    ├── .gitignore            # Git tarafından takip edilmeyecek dosyalar
    ├── README.md             # Bu dosya
    └── requirements.txt      # Gerekli Python kütüphaneleri