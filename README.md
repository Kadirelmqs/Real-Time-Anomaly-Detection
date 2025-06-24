# Gerçek Zamanlı Ağ Anomali Tespiti ve Görselleştirilmesi

Bu proje, Sivas Cumhuriyet Üniversitesi Bilgisayar Mühendisliği Bölümü bitirme projesi kapsamında geliştirilmiştir. Canlı ağ trafiğini dinleyerek, makine öğrenmesi teknikleri kullanılarak anormal aktivitelerin gerçek zamanlı olarak tespit edilmesini ve sonuçların interaktif bir web arayüzünde görselleştirilmesini amaçlamaktadır.

## Temel Özellikler

- **Canlı Paket Yakalama:** `scapy` kütüphanesi ile ağ trafiğinin anlık olarak yakalanması ve akış (flow) bazlı analizi.
- **Makine Öğrenmesi Tabanlı Tespit:** UNSW-NB15 veri seti ve yerel ağ verisi ile eğitilmiş Random Forest modeli (`v4`) kullanarak anomali tespiti.
- **Gerçek Zamanlı Arayüz:** `Flask` ve `Server-Sent Events (SSE)` ile geliştirilmiş, tespit sonuçlarını anlık olarak gösteren modern bir web paneli.
- **Dinamik Görselleştirme:** `Chart.js` kullanılarak anomali ve normal trafik dağılımının canlı grafiklerle sunulması.
- **Akıllı Açıklama:** Tespit edilen anomaliler için, modelin kararına etki eden olası nedenlerin sunulması.

## Kurulum ve Çalıştırma

Bu bölüm, projenin temiz bir sistem üzerinde kurulması ve çalıştırılması için gerekli adımları içerir.

### 1. Ön Gereksinimler

Projenin çalışabilmesi için sisteminizde aşağıdaki araçların kurulu olması gerekmektedir:

- **Git:** Versiyon kontrol sistemi.
  - Kurulum için: [https://git-scm.com/downloads](https://git-scm.com/downloads)
- **Python:** Programlama dili.
  - **Sürüm:** Python 3.10 veya üzeri. (Proje, Python 3.10.12 ile test edilmiştir).
  - Kurulum için: [https://www.python.org/downloads/](https://www.python.org/downloads/)
- **Python `venv` Modülü:** Python için sanal ortam yöneticisi.
  - Çoğu Python kurulumunda varsayılan olarak gelir. Eğer sisteminizde yoksa (örneğin bazı minimal Debian/Ubuntu kurulumları), aşağıdaki komutla kurabilirsiniz:
    ```bash
    # Debian/Ubuntu tabanlı sistemler için:
    sudo apt-get update && sudo apt-get install -y python3.10-venv
    ```
    ### 2. Proje Kurulumu

Ön gereksinimler tamamlandıktan sonra, aşağıdaki adımları takip edin:

1.  **Depoyu (repository) klonlayın:**
    ```bash
    git clone [https://github.com/Kadirelmqs/Real-Time-Anomaly-Detection.git](https://github.com/Kadirelmqs/Real-Time-Anomaly-Detection.git)
    cd Real-Time-Anomaly-Detection
    ```
2.  **Bir sanal Python ortamı oluşturun ve aktive edin:**
    ```bash
    # Sanal ortamı oluştur
    python3 -m venv venv
    
    # Sanal ortamı aktive et
    # Windows için:
    .\venv\Scripts\activate
    # Linux/macOS için:
    source venv/bin/activate
    ```
3.  **Gerekli kütüphaneleri `requirements.txt` dosyasından yükleyin:**
    ```bash
    pip install -r requirements.txt
    ```
4.  **Model Dosyasını İndirin:** Bu projenin kullandığı eğitilmiş model dosyası (`.pkl`) büyük boyutu nedeniyle depoya dahil edilmemiştir. Lütfen aşağıdaki linkten `unsw_rf_model_v6.pkl` dosyasını indirin ve projenizdeki `models` klasörünün içine yerleştirin.
    
    **[Model İndirme Linki: https://drive.google.com/drive/folders/1o5bWCYb93EguAER6Sfc3feQe0Hdu5bxO?usp=sharing]**

#### 3. Uygulamayı Başlatma

Uygulamanın ağ trafiğini dinleyebilmesi için **Yönetici (Administrator/root)** yetkilerine sahip bir terminalde çalıştırılması gerekmektedir.

```bash
# Sanal ortamın aktif olduğundan emin olun.
# Windows: Yönetici olarak açılmış bir PowerShell veya CMD'de çalıştırın.
# Linux/macOS: Komutun başına 'sudo' ekleyin (ör: sudo python3 app.py).
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