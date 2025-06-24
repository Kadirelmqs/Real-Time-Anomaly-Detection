
// // // // static/js/main.js

// // // document.addEventListener('DOMContentLoaded', function () {
// // //     // HTML elemanlarına referanslar
// // //     const logContainer = document.getElementById('log-container');
// // //     const statusIndicator = document.getElementById('status-indicator');
// // //     const statusText = document.getElementById('status-text');
// // //     const totalFlowsEl = document.getElementById('total-flows');
// // //     const anomalyCountEl = document.getElementById('anomaly-count');

// // //     // Sayaçlar için değişkenler
// // //     let totalFlows = 0;
// // //     let anomalyCount = 0;
    
// // //     // --- PERFORMANS İÇİN YENİ DEĞİŞKENLER ---
// // //     let eventBuffer = []; // Gelen verileri biriktireceğimiz tampon dizi
// // //     let renderTimer = null; // Toplu güncellemeyi tetikleyecek zamanlayıcı
// // //     const BATCH_INTERVAL = 250; // ms cinsinden toplu güncelleme aralığı

// // //     if (!!window.EventSource) {
// // //         const eventSource = new EventSource('/stream');

// // //         eventSource.onopen = function() {
// // //             // ... (bu kısım aynı) ...
// // //         };

// // //         eventSource.onmessage = function (event) {
// // //             try {
// // //                 // Gelen veriyi ayrıştır ve tampona ekle
// // //                 const result = JSON.parse(event.data);
// // //                 eventBuffer.push(result);

// // //                 // Eğer bir zamanlayıcı zaten kurulmamışsa, yeni bir tane kur.
// // //                 // Bu, 250ms içinde gelen tüm verilerin tek bir render işleminde birleşmesini sağlar.
// // //                 if (!renderTimer) {
// // //                     renderTimer = setTimeout(renderBatch, BATCH_INTERVAL);
// // //                 }
// // //             } catch (e) {
// // //                 console.error("Gelen veri JSON formatında değil:", event.data);
// // //             }
// // //         };

// // //         eventSource.onerror = function (err) {
// // //             // ... (bu kısım aynı) ...
// // //         };

// // //     } else {
// // //         // ... (bu kısım aynı) ...
// // //     }

// // //     // --- YENİ FONKSİYON: Toplu Güncelleme Mantığı ---
// // //     function renderBatch() {
// // //         if (eventBuffer.length === 0) {
// // //             renderTimer = null; // Eğer ar arada veri gelmediyse zamanlayıcıyı iptal et
// // //             return;
// // //         }

// // //         // Buffer'ı kopyala ve orijinalini hemen boşalt ki yeni veriler birikmeye devam etsin.
// // //         const itemsToRender = [...eventBuffer];
// // //         eventBuffer = [];
        
// // //         // DocumentFragment, birden çok elemanı DOM'a tek seferde eklemek için en performanslı yoldur.
// // //         const fragment = document.createDocumentFragment();

// // //         itemsToRender.forEach(result => {
// // //             // Sayaçları güncelle
// // //             totalFlows++;
// // //             if (result.prediction === 1) {
// // //                 anomalyCount++;
// // //             }

// // //             // Arayüze eklenecek HTML elemanını oluştur (önceki kodla aynı mantık)
// // //             const logEntry = createLogEntryElement(result);
// // //             fragment.appendChild(logEntry);
// // //         });
        
// // //         // Tüm yeni elemanları tek bir işlemle DOM'a ekle!
// // //         logContainer.prepend(fragment);
        
// // //         // Sayaçları arayüzde güncelle
// // //         totalFlowsEl.textContent = totalFlows;
// // //         anomalyCountEl.textContent = anomalyCount;

// // //         // Eski kayıtları temizle
// // //         while (logContainer.children.length > 200) {
// // //             logContainer.removeChild(logContainer.lastChild);
// // //         }

// // //         // Zamanlayıcıyı sıfırla
// // //         renderTimer = null;
// // //     }

// // //     // HTML elemanı oluşturma işini ayrı bir fonksiyona taşıdık
// // //     function createLogEntryElement(result) {
// // //         const keyFeaturesForDisplay = { 'dur': 'Süre (sn)', 'state': 'Durum', 'spkts': 'Kaynak Pkt.', 'dpkts': 'Hedef Pkt.', 'sbytes': 'Kaynak Byte', 'dbytes': 'Hedef Byte' };
// // //         const flowData = result.data;
// // //         const isAnomaly = result.prediction === 1;

// // //         const logEntry = document.createElement('div');
// // //         logEntry.classList.add('log-entry', isAnomaly ? 'anomaly' : 'normal');

// // //         const predictionLabel = isAnomaly ? 'ANOMALİ' : 'Normal';
// // //         const predictionClass = isAnomaly ? 'anomaly' : 'normal';

// // //         // 'explanation' alanı varsa ve anomali ise, gösterilecek HTML'i hazırla
// // //         let explanationHtml = '';
// // //         if (isAnomaly && result.explanation) {
// // //             explanationHtml = `<div class="explanation"><strong>Olası Neden:</strong> ${result.explanation}</div>`;
// // //         }
        
// // //         let summaryHtml = `<div class="data-summary">...</div>`; // (Öncekiyle aynı HTML yapısı)
// // //         // (Bu uzun HTML string'ini okunabilirlik için kısalttım, önceki cevaptaki yapıyı kullanabilirsiniz)
// // //         let allDetailsHtml = `<div class="all-details-content">...</div>`;

// // //         // Tam HTML yapısı
// // //         summaryHtml = `<div class="data-summary"><div class="key-feature-display flow-title"><i class="fa-solid ${isAnomaly ? 'fa-triangle-exclamation' : 'fa-shield-check'}"></i> ${flowData.proto.toUpperCase()} | ${flowData.state}</div>`;
// // //         for (const key in keyFeaturesForDisplay) {
// // //             let value = flowData[key] !== undefined ? flowData[key] : 'N/A';
// // //             if (typeof value === 'number' && !Number.isInteger(value)) { value = value.toFixed(3); }
// // //             summaryHtml += `<div class="key-feature-display"><span class="label">${keyFeaturesForDisplay[key]}</span><span class="value">${value}</span></div>`;
// // //         }
// // //         summaryHtml += `<div class="prediction-details"><span class="prediction ${predictionClass}">${predictionLabel} (Olasılık: ${result.probability.toFixed(2)})</span></div><button class="details-toggle-button">Detaylar</button></div>`;
// // //         allDetailsHtml = `<div class="all-details-content"><ul>`;
// // //         for (const key in flowData) {
// // //             let value = flowData[key];
// // //             if (typeof value === 'number' && !Number.isInteger(value)) { value = value.toFixed(4); }
// // //             allDetailsHtml += `<li><strong>${key}:</strong> ${value}</li>`;
// // //         }
// // //         allDetailsHtml += `</ul></div>`;
// // //         logEntry.innerHTML = summaryHtml + allDetailsHtml;

// // //         const toggleButton = logEntry.querySelector('.details-toggle-button');
// // //         const detailsContent = logEntry.querySelector('.all-details-content');
// // //         toggleButton.addEventListener('click', () => {
// // //             const isHidden = detailsContent.style.display !== 'block';
// // //             detailsContent.style.display = isHidden ? 'block' : 'none';
// // //             toggleButton.textContent = isHidden ? 'Gizle' : 'Detaylar';
// // //         });

// // //         return logEntry;
// // //     }
// // // });


// // document.addEventListener('DOMContentLoaded', function () {
// //     // HTML elemanlarına referanslar
// //     const logContainer = document.getElementById('log-container');
// //     const statusIndicator = document.getElementById('status-indicator');
// //     const statusText = document.getElementById('status-text');
// //     const totalFlowsEl = document.getElementById('total-flows');
// //     const anomalyCountEl = document.getElementById('anomaly-count');
// //     const chartCanvas = document.getElementById('anomalyChart');

// //     // Sayaçlar ve grafik için değişkenler
// //     let totalFlows = 0;
// //     let anomalyCount = 0;
// //     let anomalyChart = null;
    
// //     // Performans için değişkenler
// //     let eventBuffer = [];
// //     let renderTimer = null;
// //     const BATCH_INTERVAL = 250;

// //     // --- GRAFİK BAŞLATMA ---
// //     if (chartCanvas) {
// //         const ctx = chartCanvas.getContext('2d');
// //         anomalyChart = new Chart(ctx, {
// //             type: 'doughnut',
// //             data: {
// //                 labels: ['Normal Akışlar', 'Anomaliler'],
// //                 datasets: [{
// //                     label: 'Akış Dağılımı',
// //                     data: [0, 0],
// //                     backgroundColor: ['rgba(40, 167, 69, 0.8)', 'rgba(220, 53, 69, 0.8)'],
// //                     borderColor: 'rgba(255, 255, 255, 0.5)',
// //                     borderWidth: 2
// //                 }]
// //             },
// //             options: {
// //                 responsive: true,
// //                 maintainAspectRatio: false,
// //                 plugins: {
// //                     legend: { position: 'top' },
// //                     title: { display: true, text: 'Normal ve Anomali Akış Dağılımı' }
// //                 },
// //                 cutout: '60%'
// //             }
// //         });
// //     }

// //     // --- SSE BAĞLANTISI ---
// //     if (!!window.EventSource) {
// //         const eventSource = new EventSource('/stream');

// //         eventSource.onopen = function() {
// //             if (statusIndicator) statusIndicator.className = 'connected';
// //             if (statusText) statusText.textContent = 'Bağlandı';
// //         };

// //         eventSource.onmessage = function (event) {
// //             try {



// //                 const result = JSON.parse(event.data);
// //                 console.log("%c--- JSON OLARAK AYRIŞTIRILMIŞ NESNE ---", "color: green; font-weight: bold;");
// //                 console.log(result);
// //                 eventBuffer.push(result);
// //                 if (!renderTimer) {
// //                     renderTimer = setTimeout(renderBatch, BATCH_INTERVAL);
// //                 }
// //             } catch (e) {
// //                 console.error("Gelen veri JSON formatında değil:", event.data, e);
// //             }
// //         };

// //         eventSource.onerror = function (err) {
// //             if (statusIndicator) statusIndicator.className = 'disconnected';
// //             if (statusText) statusText.textContent = 'Bağlantı Hatası!';
// //             console.error("EventSource hatası:", err);
// //             eventSource.close();
// //         };

// //     } else {
// //         if (statusText) statusText.textContent = 'Tarayıcınız SSE desteklemiyor.';
// //     }

// //     // --- Toplu Güncelleme Fonksiyonu ---
// //     function renderBatch() {
// //         if (eventBuffer.length === 0) {
// //             renderTimer = null;
// //             return;
// //         }

// //         const itemsToRender = [...eventBuffer];
// //         eventBuffer = [];
        
// //         const fragment = document.createDocumentFragment();

// //         itemsToRender.forEach(result => {
// //             totalFlows++;
// //             if (result.prediction === 1) {
// //                 anomalyCount++;
// //             }
// //             const logEntry = createLogEntryElement(result);
// //             fragment.appendChild(logEntry);
// //         });
        
// //         if (logContainer) logContainer.prepend(fragment);
        
// //         if (totalFlowsEl) totalFlowsEl.textContent = totalFlows;
// //         if (anomalyCountEl) anomalyCountEl.textContent = anomalyCount;

// //         // Grafik Güncelleme
// //         if (anomalyChart) {
// //             anomalyChart.data.datasets[0].data[0] = totalFlows - anomalyCount;
// //             anomalyChart.data.datasets[0].data[1] = anomalyCount;
// //             anomalyChart.update('none');
// //         }

// //         if (logContainer) {
// //             while (logContainer.children.length > 200) {
// //                 logContainer.removeChild(logContainer.lastChild);
// //             }
// //         }

// //         renderTimer = null;
// //     }

// //     // --- HTML Log Elemanı Oluşturma Fonksiyonu ---
// //     function createLogEntryElement(result) {
// //         const keyFeaturesForDisplay = { 'dur': 'Sür (sn)', 'state': 'Durum', 'spkts': 'Kynk Pkt', 'dpkts': 'Hdf Pkt', 'sbytes': 'Kynk Byte', 'dbytes': 'Hdf Byte' };
// //         const flowData = result.data;

// //         // --- DÜZELTME 1: KARAR MEKANİZMASI ---
// //         // Arayüzdeki karar, SADECE sunucudan gelen 'prediction' değerine göre alınır.
// //         const isAnomaly = result.prediction === 1;

// //         const logEntry = document.createElement('div');
// //         logEntry.classList.add('log-entry', isAnomaly ? 'anomaly' : 'normal');

// //         const predictionLabel = isAnomaly ? 'ANOMALİ' : 'Normal';
        
// //         // --- DÜZELTME 2: DOĞRU OLASILIĞI GÖSTERME ---
// //         // Anomali ise anomali olasılığını, normal ise normal olma olasılığını göster.
// //         const displayProbability = isAnomaly ? result.probability_anomaly : result.probability_normal;
// //         // Olasılık tanımsız veya null ise hata vermemesi için kontrol
// //         const probabilityText = (typeof displayProbability === 'number') 
// //             ? `(Olasılık: ${(displayProbability * 100).toFixed(1)}%)`
// //             : '(Olasılık: N/A)';

// //         // 'explanation' alanı varsa ve anomali ise, gösterilecek HTML'i hazırla
// //         let explanationHtml = '';
// //         if (isAnomaly && result.explanation) {
// //             explanationHtml = `<div class="explanation"><strong>Olası Neden:</strong> ${result.explanation}</div>`;
// //         }
        
// //         // Özet kısmını oluşturalım
// //         let summaryHtml = `
// //             <div class="data-summary">
// //                 <div class="key-feature-display flow-title">
// //                     <i class="fa-solid ${isAnomaly ? 'fa-triangle-exclamation' : 'fa-shield-check'}"></i> 
// //                     ${(flowData.proto || 'N/A').toUpperCase()} | ${flowData.state || 'N/A'}
// //                 </div>`;

// //         for (const key in keyFeaturesForDisplay) {
// //             let value = flowData[key] !== undefined ? flowData[key] : 'N/A';
// //             if (typeof value === 'number' && !Number.isInteger(value)) { value = value.toFixed(3); }
// //             summaryHtml += `<div class="key-feature-display"><span class="label">${keyFeaturesForDisplay[key]}</span><span class="value">${value}</span></div>`;
// //         }
        
// //         summaryHtml += `
// //                 <div class="prediction-details">
// //                     <span class="prediction ${isAnomaly ? 'anomaly' : 'normal'}">${predictionLabel} ${probabilityText}</span>
// //                 </div>
// //                 <button class="details-toggle-button">Detaylar</button>
// //             </div>`;

// //         // Tüm detayları içeren kısmı oluşturalım
// //         let allDetailsHtml = `<div class="all-details-content"><ul>`;
// //         for (const key in flowData) {
// //             let value = flowData[key];
// //             if (typeof value === 'number' && !Number.isInteger(value)) { value = value.toFixed(4); }
// //             allDetailsHtml += `<li><strong>${key}:</strong> ${value}</li>`;
// //         }
// //         allDetailsHtml += `</ul></div>`;

// //         // Oluşturulan HTML parçalarını birleştir
// //         logEntry.innerHTML = summaryHtml + explanationHtml + allDetailsHtml;

// //         // Detaylar butonunun işlevselliği
// //         const toggleButton = logEntry.querySelector('.details-toggle-button');
// //         const detailsContent = logEntry.querySelector('.all-details-content');
// //         if(toggleButton && detailsContent) {
// //             toggleButton.addEventListener('click', (e) => {
// //                 e.stopPropagation(); // Olayın log-entry'nin tamamına yayılmasını engelle
// //                 const isHidden = detailsContent.style.display !== 'block';
// //                 detailsContent.style.display = isHidden ? 'block' : 'none';
// //                 toggleButton.textContent = isHidden ? 'Gizle' : 'Detaylar';
// //             });
// //         }

// //         return logEntry;
// //     }
// // });

// document.addEventListener('DOMContentLoaded', function () {
//     // HTML elemanlarına referanslar
//     const anomalyLogContainer = document.getElementById('anomaly-log-container');
//     const normalLogContainer = document.getElementById('normal-log-container');
//     const statusIndicator = document.getElementById('status-indicator');
//     const statusText = document.getElementById('status-text');
//     const totalFlowsEl = document.getElementById('total-flows');
//     const anomalyCountEl = document.getElementById('anomaly-count');
//     const chartCanvas = document.getElementById('anomalyTimelineChart');

//     // Sayaçlar ve grafik için değişkenler
//     let totalFlows = 0;
//     let anomalyCount = 0;
//     let timelineChart = null;
//     const MAX_CHART_POINTS = 30; // Grafikte gösterilecek maksimum zaman noktası

//     // Performans için değişkenler
//     let eventBuffer = [];
//     let renderTimer = null;
//     const BATCH_INTERVAL = 500; // Arayüzün daha rahat nefes alması için aralığı artırdık

//     // --- ZAMAN SERİSİ GRAFİĞİ BAŞLATMA ---
//     if (chartCanvas) {
//         const ctx = chartCanvas.getContext('2d');
//         timelineChart = new Chart(ctx, {
//             type: 'line', // Grafik türü: çizgi
//             data: {
//                 labels: [], // Zaman etiketleri (örn: 15:30:05)
//                 datasets: [{
//                     label: 'Tespit Edilen Anomali Sayısı (500ms aralıkla)',
//                     data: [], // Anomali sayıları
//                     borderColor: 'rgba(220, 53, 69, 1)',
//                     backgroundColor: 'rgba(220, 53, 69, 0.2)',
//                     fill: true,
//                     tension: 0.4
//                 }]
//             },
//             // main.js -> new Chart(...) içindeki options: { ... } bloğunun tamamını bununla değiştirin.

//             options: {
//                 responsive: true,
//                 maintainAspectRatio: false,
//                 scales: {
//                     y: {
//                         beginAtZero: true,
//                         ticks: { 
//                             stepSize: 1, 
//                             color: '#a7a9be' // Eksen yazı rengi
//                         },
//                         grid: {
//                             color: 'rgba(255, 255, 255, 0.1)' // Izgara çizgileri
//                         }
//                     },
//                     x: {
//                         ticks: { 
//                             color: '#a7a9be' // Eksen yazı rengi
//                         },
//                         grid: {
//                             color: 'rgba(255, 255, 255, 0.1)' // Izgara çizgileri
//                         }
//                     }
//                 },
//                 plugins: {
//                     legend: {
//                         labels: { 
//                             color: '#e0fbfc' // Legend yazı rengi
//                         }
//                     },
//                     // --- YENİ EKLENEN TOOLTIP AYARLARI ---
//                     tooltip: {
//                         enabled: true,
//                         backgroundColor: 'rgba(15, 52, 96, 0.9)', // Koyu mavi, yarı saydam arka plan
//                         titleColor: '#ffffff',                   // Başlık rengi (örn: zaman damgası)
//                         bodyColor: '#e0fbfc',                    // İçerik rengi (örn: Anomali Sayısı: 1)
//                         borderColor: 'rgba(112, 145, 230, 0.7)', // Vurgu rengi kenarlık
//                         borderWidth: 1,
//                         padding: 10,
//                         cornerRadius: 6,
//                         usePointStyle: true,
//                         bodyFont: {
//                             family: "'Roboto', sans-serif" // Temamızla aynı font ailesi
//                         },
//                         titleFont: {
//                             family: "'Roboto', sans-serif",
//                             weight: 'bold'
//                         }
//                     }
//                     // --- YENİ KOD SONU ---
//                 }
//             }
//         });
//     }

//     // --- SSE BAĞLANTISI ---
//     if (!!window.EventSource) {
//         const eventSource = new EventSource('/stream');
//         eventSource.onopen = function() {
//             if (statusIndicator) statusIndicator.className = 'connected';
//             if (statusText) statusText.textContent = 'Bağlandı';
//         };
//         eventSource.onmessage = function (event) {
//             try {
//                 const result = JSON.parse(event.data);
//                 eventBuffer.push(result);
//                 if (!renderTimer) {
//                     renderTimer = setTimeout(renderBatch, BATCH_INTERVAL);
//                 }
//             } catch (e) {
//                 console.error("Gelen veri JSON formatında değil:", event.data, e);
//             }
//         };
//         eventSource.onerror = function (err) {
//             if (statusIndicator) statusIndicator.className = 'disconnected';
//             if (statusText) statusText.textContent = 'Bağlantı Hatası!';
//             console.error("EventSource hatası:", err);
//         };
//     }

//     // --- Toplu Güncelleme Fonksiyonu ---
//     function renderBatch() {
//         if (eventBuffer.length === 0) {
//             renderTimer = null;
//             return;
//         }

//         const itemsToRender = [...eventBuffer];
//         eventBuffer = [];
        
//         const anomalyFragment = document.createDocumentFragment();
//         const normalFragment = document.createDocumentFragment();
//         let anomaliesInThisBatch = 0;

//         itemsToRender.forEach(result => {
//             totalFlows++;
//             const logEntry = createLogEntryElement(result);
            
//             if (result.prediction === 1) {
//                 anomalyCount++;
//                 anomaliesInThisBatch++;
//                 anomalyFragment.appendChild(logEntry);
//             } else {
//                 normalFragment.appendChild(logEntry);
//             }
//         });
        
//         if (anomalyLogContainer && anomalyFragment.children.length > 0) anomalyLogContainer.prepend(anomalyFragment);
//         if (normalLogContainer && normalFragment.children.length > 0) normalLogContainer.prepend(normalFragment);
        
//         if (totalFlowsEl) totalFlowsEl.textContent = totalFlows;
//         if (anomalyCountEl) anomalyCountEl.textContent = anomalyCount;

//         // Grafik Güncelleme
//         if (timelineChart) {
//             const now = new Date();
//             const timeLabel = now.toTimeString().split(' ')[0]; // Sadece HH:MM:SS kısmını al

//             timelineChart.data.labels.push(timeLabel);
//             timelineChart.data.datasets[0].data.push(anomaliesInThisBatch);

//             if (timelineChart.data.labels.length > MAX_CHART_POINTS) {
//                 timelineChart.data.labels.shift();
//                 timelineChart.data.datasets[0].data.shift();
//             }
//             timelineChart.update();
//         }

//         // Eski kayıtları temizle
//         if (anomalyLogContainer) { while (anomalyLogContainer.children.length > 100) { anomalyLogContainer.removeChild(anomalyLogContainer.lastChild); } }
//         if (normalLogContainer) { while (normalLogContainer.children.length > 50) { normalLogContainer.removeChild(normalLogContainer.lastChild); } }

//         renderTimer = null;
//     }

//     // --- HTML Log Elemanı Oluşturma Fonksiyonu ---
//     // Bu fonksiyon, en son çalışan halinizdeki mantığı içeriyor.
//     function createLogEntryElement(result) {
//         const flowData = result.data;
//         const isAnomaly = result.prediction === 1;
//         const logEntry = document.createElement('div');
//         logEntry.className = `log-entry ${isAnomaly ? 'anomaly' : 'normal'}`;
//         const predictionLabel = isAnomaly ? 'ANOMALİ' : 'Normal';
//         const displayProbability = isAnomaly ? result.probability_anomaly : result.probability_normal;
//         const probabilityText = (typeof displayProbability === 'number') 
//             ? `(${(displayProbability * 100).toFixed(1)}%)`
//             : '(N/A)';
//         let explanationHtml = '';
//         if (isAnomaly && result.explanation) {
//             explanationHtml = `<div class="explanation"><strong>Neden:</strong> ${result.explanation}</div>`;
//         }
//         logEntry.innerHTML = `
//             <div class="log-header">
//                 <div class="log-title">
//                     <i class="fa-solid ${isAnomaly ? 'fa-triangle-exclamation' : 'fa-shield-halved'}"></i>
//                     <span>${flowData.proto ? flowData.proto.toUpperCase() : ''} | ${flowData.state || ''}</span>
//                     <span class="log-time">${new Date().toTimeString().split(' ')[0]}</span>
//                 </div>
//                 <div class="log-status">
//                     <span class="prediction-label">${predictionLabel}</span>
//                     <span class="probability">${probabilityText}</span>
//                 </div>
//             </div>
//             ${explanationHtml}
//             <div class="log-details">
//                 <span class="flow-info">
//                     <i class="fa-solid fa-computer"></i> ${flowData.sttl || '0'}
//                     <span class="bytes">(${flowData.sbytes || 0} B)</span>
//                     <i class="fa-solid fa-right-long"></i>
//                     <i class="fa-solid fa-server"></i> ${flowData.dttl || '0'}
//                     <span class="bytes">(${flowData.dbytes || 0} B)</span>
//                 </span>
//             </div>
//         `;
//         return logEntry;
//     }
// });

document.addEventListener('DOMContentLoaded', function () {
    // HTML elemanlarına referanslar
    const anomalyLogContainer = document.getElementById('anomaly-log-container');
    const normalLogContainer = document.getElementById('normal-log-container');
    const statusIndicator = document.getElementById('status-indicator');
    const statusText = document.getElementById('status-text');
    const totalFlowsEl = document.getElementById('total-flows');
    const anomalyCountEl = document.getElementById('anomaly-count');
    const chartCanvas = document.getElementById('anomalyTimelineChart');

    // Sayaçlar ve grafik için değişkenler
    let totalFlows = 0;
    let anomalyCount = 0;
    let timelineChart = null;
    const MAX_CHART_POINTS = 30;

    // Performans için değişkenler
    let eventBuffer = [];
    let renderTimer = null;
    const BATCH_INTERVAL = 500;

    // Grafik Başlatma
    if (chartCanvas) {
        const ctx = chartCanvas.getContext('2d');
        timelineChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Tespit Edilen Anomali Sayısı',
                    data: [],
                    borderColor: 'rgba(220, 53, 69, 1)',
                    backgroundColor: 'rgba(220, 53, 69, 0.2)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: { /* ... önceki adımdaki options ayarları ... */ }
        });
    }

    // SSE Bağlantısı
    if (!!window.EventSource) {
        const eventSource = new EventSource('/stream');
        eventSource.onopen = function() {
            if (statusIndicator) statusIndicator.className = 'connected';
            if (statusText) statusText.textContent = 'Bağlandı';
        };
        eventSource.onmessage = function (event) {
            try {
                const result = JSON.parse(event.data);
                eventBuffer.push(result);
                if (!renderTimer) {
                    renderTimer = setTimeout(renderBatch, BATCH_INTERVAL);
                }
            } catch (e) {
                console.error("Gelen veri JSON formatında değil:", event.data, e);
            }
        };
        eventSource.onerror = function (err) {
            if (statusIndicator) statusIndicator.className = 'disconnected';
            if (statusText) statusText.textContent = 'Bağlantı Hatası!';
            console.error("EventSource hatası:", err);
        };
    }

    // Toplu Güncelleme Fonksiyonu
    function renderBatch() {
        if (eventBuffer.length === 0) {
            renderTimer = null;
            return;
        }
        const itemsToRender = [...eventBuffer];
        eventBuffer = [];
        
        const anomalyFragment = document.createDocumentFragment();
        const normalFragment = document.createDocumentFragment();
        let anomaliesInThisBatch = 0;

        itemsToRender.forEach(result => {
            totalFlows++;
            const logEntry = createLogEntryElement(result);
            if (result.prediction === 1) {
                anomalyCount++;
                anomaliesInThisBatch++;
                anomalyFragment.appendChild(logEntry);
            } else {
                normalFragment.appendChild(logEntry);
            }
        });
        
        if (anomalyLogContainer && anomalyFragment.children.length > 0) anomalyLogContainer.prepend(anomalyFragment);
        if (normalLogContainer && normalFragment.children.length > 0) normalLogContainer.prepend(normalFragment);
        
        if (totalFlowsEl) totalFlowsEl.textContent = totalFlows;
        if (anomalyCountEl) anomalyCountEl.textContent = anomalyCount;

        if (timelineChart && itemsToRender.length > 0) { // Her render'da zaman etiketini ekle
            const now = new Date();
            const timeLabel = now.toTimeString().split(' ')[0];
            timelineChart.data.labels.push(timeLabel);
            timelineChart.data.datasets[0].data.push(anomaliesInThisBatch);
            if (timelineChart.data.labels.length > MAX_CHART_POINTS) {
                timelineChart.data.labels.shift();
                timelineChart.data.datasets[0].data.shift();
            }
            timelineChart.update();
        }
        
        // Eski kayıtları temizle...
        if (anomalyLogContainer) { while (anomalyLogContainer.children.length > 100) { anomalyLogContainer.removeChild(anomalyLogContainer.lastChild); } }
        if (normalLogContainer) { while (normalLogContainer.children.length > 50) { normalLogContainer.removeChild(normalLogContainer.lastChild); } }

        renderTimer = null;
    }

    // --- HTML Log Elemanı Oluşturma Fonksiyonu (YENİ VE GELİŞMİŞ HALİ) ---
    function createLogEntryElement(result) {
        // Modelin en önemli bulduğu ve ana ekranda gösterilecek özellikler
        const keyFeaturesForDisplay = {
            'sttl': 'Kaynak TTL',
            'rate': 'Paket Oranı (pps)',
            'dload': 'Hedef Yük (bps)',
            'dttl': 'Hedef TTL',
            'sload': 'Kaynak Yük (bps)',
            'dmean': 'Ort. Hedef Pkt Boyutu'
        };

        // Tüm özellikler ve açıklamaları (Detaylar butonu için)
        const allFeatureExplanations = {
            'dur': 'Akışın toplam süresi (saniye)', 'proto': 'İletişim protokolü',
            'service': 'Ağ servis tipi', 'state': 'Bağlantı durumu',
            'spkts': 'Kaynaktan gönderilen paket sayısı', 'dpkts': 'Hedefe gönderilen paket sayısı',
            'sbytes': 'Kaynaktan gönderilen bayt miktarı', 'dbytes': 'Hedefe gönderilen bayt miktarı',
            'rate': 'Saniye başına toplam paket oranı', 'sttl': 'Kaynağın yaşam süresi (TTL)',
            'dttl': 'Hedefin yaşam süresi (TTL)', 'sload': 'Kaynağın saniye başına bit yükü',
            'dload': 'Hedefin saniye başına bit yükü', 'sinpkt': 'Kaynak paketleri arası ortalama süre',
            'dinpkt': 'Hedef paketleri arası ortalama süre', 'sjit': 'Kaynak paketleri arası zamanlama titreşimi (jitter)',
            'djit': 'Hedef paketleri arası zamanlama titreşimi (jitter)', 'swin': 'Kaynak TCP pencere boyutu',
            'stcpb': 'Kaynak TCP sequence number', 'dtcpb': 'Hedef TCP sequence number',
            'dwin': 'Hedef TCP pencere boyutu', 'smean': 'Ortalama kaynak paket boyutu (bayt)',
            'dmean': 'Ortalama hedef paket boyutu (bayt)'
        };

        const flowData = result.data;
        const isAnomaly = result.prediction === 1;

        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${isAnomaly ? 'anomaly' : 'normal'}`;

        // --- ANA GÖRÜNÜM (ÖNEMLİ ÖZELLİKLER) ---
        let summaryHtml = `<div class="log-header">
                                <i class="fa-solid ${isAnomaly ? 'fa-triangle-exclamation' : 'fa-shield-check'}"></i>
                                <span class="prediction-label">${isAnomaly ? 'ANOMALİ' : 'Normal'}</span>
                                <span class="probability">(${(isAnomaly ? result.probability_anomaly * 100 : result.probability_normal * 100).toFixed(1)}%)</span>
                                <span class="timestamp">${new Date().toTimeString().split(' ')[0]}</span>
                           </div>
                           <div class="key-features">`;
        
        for (const key in keyFeaturesForDisplay) {
            let value = flowData[key];
            if (typeof value === 'number' && !Number.isInteger(value)) { value = value.toExponential(2); } // Bilimsel gösterim
            summaryHtml += `<div class="key-feature-item">
                                <span class="label">${keyFeaturesForDisplay[key]}</span>
                                <span class="value">${value}</span>
                            </div>`;
        }

        summaryHtml += `</div>`;
        
        // Anomali ise açıklamayı ekle
        if (isAnomaly && result.explanation) {
            summaryHtml += `<div class="explanation"><strong>Olası Neden:</strong> ${result.explanation}</div>`;
        }

        // --- GİZLİ DETAY BÖLÜMÜ (TÜM ÖZELLİKLER) ---
        let detailsHtml = `<div class="details-section" style="display: none;">
                               <h4>Tüm Akış Özellikleri</h4>
                               <ul>`;
        for (const key in allFeatureExplanations) {
            if (flowData.hasOwnProperty(key)) {
                let value = flowData[key];
                if (typeof value === 'number' && !Number.isInteger(value)) { value = value.toFixed(4); }
                detailsHtml += `<li><strong>${allFeatureExplanations[key] || key}:</strong> ${value}</li>`;
            }
        }
        detailsHtml += `</ul></div>`;
        
        // Butonu ekle
        let buttonHtml = `<div class="log-footer"><button class="details-toggle-button">Detayları Göster</button></div>`;

        // Tüm HTML'i birleştir
        logEntry.innerHTML = summaryHtml + detailsHtml + buttonHtml;


        // Buton için event listener ekle
        const toggleButton = logEntry.querySelector('.details-toggle-button');
        const detailsContent = logEntry.querySelector('.details-section');
        
        toggleButton.addEventListener('click', (e) => {
            e.stopPropagation();
            const isHidden = detailsContent.style.display !== 'block';
            detailsContent.style.display = isHidden ? 'block' : 'none';
            toggleButton.textContent = isHidden ? 'Gizle' : 'Detayları Göster';
        });

        return logEntry;
    }
});