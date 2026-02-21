// 프리미엄 자산 데이터 및 실시간 시뮬레이션 엔진
const assetDatabase = {
    'S&P500': { symbol: 'SPX', category: '지수', basePrice: 5120, volatility: 0.15, risk: '보통', currency: 'USD' },
    '나스닥100': { symbol: 'NDX', category: '지수', basePrice: 18200, volatility: 0.25, risk: '높음', currency: 'USD' },
    'QQQ': { symbol: 'QQQ', category: 'ETF', basePrice: 445, volatility: 0.22, risk: '높음', currency: 'USD' },
    'NVDA': { symbol: 'NVDA', category: '해외 주식', basePrice: 920, volatility: 0.45, risk: '매우 높음', currency: 'USD' },
    '비트코인': { symbol: 'BTC', category: '암호화폐', basePrice: 0, volatility: 0.55, risk: '매우 높음', currency: 'KRW' }, // 초기값 0, API로 업데이트
    '이더리움': { symbol: 'ETH', category: '암호화폐', basePrice: 0, volatility: 0.60, risk: '매우 높음', currency: 'KRW' },
    '리플': { symbol: 'XRP', category: '암호화폐', basePrice: 0, volatility: 0.70, risk: '높음', currency: 'KRW' },
    '삼성전자': { symbol: '005930.KS', category: '국내 주식', basePrice: 78500, volatility: 0.18, risk: '보통', currency: 'KRW' }
};

let chart, candleSeries, currentAssetKey, currentPeriod = '1M', updateTimer;
let calcChartInstance = null; // 계산기 차트 인스턴스

document.addEventListener('DOMContentLoaded', () => {
    initChart();
    initNavigation();
    renderFavorites();
    fetchCryptoPrices(); // 실시간 코인 시세 가져오기
    setInterval(fetchCryptoPrices, 30000); // 30초마다 갱신
    
    // 초기 로드 시 S&P500 자동 표시
    handleSearch('S&P500');

    document.getElementById('assetSearch').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch(e.target.value);
    });

    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentPeriod = btn.dataset.period;
            if (currentAssetKey) startSimulation(currentAssetKey);
        });
    });
});

// CoinGecko API를 이용한 실시간 암호화폐 시세 연동
async function fetchCryptoPrices() {
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,ripple&vs_currencies=krw&include_24hr_change=true');
        const data = await response.json();

        if (data.bitcoin) {
            updateAssetPrice('비트코인', data.bitcoin.krw);
        }
        if (data.ethereum) {
            updateAssetPrice('이더리움', data.ethereum.krw);
        }
        if (data.ripple) {
            updateAssetPrice('리플', data.ripple.krw);
        }
    } catch (error) {
        console.error("암호화폐 시세 연동 실패:", error);
    }
}

function updateAssetPrice(key, price) {
    if (assetDatabase[key]) {
        assetDatabase[key].basePrice = price;
        // 현재 보고 있는 자산이 암호화폐라면 화면도 즉시 갱신
        if (currentAssetKey === key) {
            const currentPriceEl = document.getElementById('currentPrice');
            if (currentPriceEl) {
                currentPriceEl.textContent = `₩${price.toLocaleString()}`;
            }
        }
    }
}

// 복리 계산기 로직
function calculateCompound() {
    const principal = parseFloat(document.getElementById('calcPrincipal').value);
    const monthly = parseFloat(document.getElementById('calcMonthly').value);
    const rate = parseFloat(document.getElementById('calcRate').value) / 100 / 12; // 월 이자율
    const years = parseFloat(document.getElementById('calcYears').value);
    const months = years * 12;

    let total = principal;
    let totalInvested = principal;
    const labels = [];
    const dataPoints = [];

    for (let i = 1; i <= months; i++) {
        total = total * (1 + rate) + monthly;
        totalInvested += monthly;
        
        if (i % 12 === 0) { // 1년 단위로 데이터 저장
            labels.push(`${i / 12}년`);
            dataPoints.push(Math.round(total));
        }
    }

    const interest = total - totalInvested;

    // 결과 표시
    document.getElementById('resultTotal').textContent = `${Math.round(total).toLocaleString()}원`;
    document.getElementById('resultInterest').textContent = `+${Math.round(interest).toLocaleString()}원`;
    document.getElementById('resultPrincipal').textContent = `${Math.round(totalInvested).toLocaleString()}원`;

    // 차트 그리기
    const ctx = document.getElementById('calcChart').getContext('2d');
    
    if (calcChartInstance) {
        calcChartInstance.destroy();
    }

    calcChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '예상 자산 추이',
                data: dataPoints,
                borderColor: '#38bdf8',
                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#94a3b8' } }
            },
            scales: {
                x: { ticks: { color: '#94a3b8' }, grid: { color: '#222834' } },
                y: { ticks: { color: '#94a3b8' }, grid: { color: '#222834' } }
            }
        }
    });
}

function initChart() {
    const container = document.getElementById('mainChart');
    chart = LightweightCharts.createChart(container, {
        layout: { background: { color: '#11141d' }, textColor: '#94a3b8', fontSize: 12 },
        grid: { vertLines: { color: '#1e222d' }, horzLines: { color: '#1e222d' } },
        crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
        rightPriceScale: { borderColor: '#2b2f36', autoScale: true },
        timeScale: { borderColor: '#2b2f36', timeVisible: true, secondsVisible: false }
    });
    
    candleSeries = chart.addCandlestickSeries({
        upColor: '#00e699', downColor: '#ff4d4d', borderVisible: false,
        wickUpColor: '#00e699', wickDownColor: '#ff4d4d'
    });
}

// 실시간 시뮬레이션 시작
function startSimulation(key) {
    if (updateTimer) clearInterval(updateTimer);
    currentAssetKey = key;
    const asset = assetDatabase[key];
    
    // 1. 과거 데이터 생성 및 초기 렌더링
    let points = getPointsByPeriod(currentPeriod);
    let data = generateInitialData(asset.basePrice, asset.volatility, points);
    candleSeries.setData(data);
    chart.timeScale().fitContent();

    // 2. 실시간 가격 변동 엔진 가동 (1초마다 업데이트)
    updateTimer = setInterval(() => {
        const lastCandle = data[data.length - 1];
        const assetInfo = assetDatabase[key];
        
        // 미세한 가격 변동 시뮬레이션 (Brownian Motion)
        const volatilityFactor = assetInfo.volatility / 100;
        const change = (Math.random() - 0.5) * volatilityFactor * lastCandle.close;
        const newClose = lastCandle.close + change;
        
        const updatedCandle = {
            ...lastCandle,
            close: newClose,
            high: Math.max(lastCandle.high, newClose),
            low: Math.min(lastCandle.low, newClose)
        };
        
        data[data.length - 1] = updatedCandle;
        candleSeries.update(updatedCandle);
        
        updateUI(key, data);
    }, 1000);
}

function updateUI(key, data) {
    const asset = assetDatabase[key];
    const current = data[data.length - 1].close;
    const start = data[0].open;
    const changePercent = ((current - start) / start * 100).toFixed(2);
    
    // 가격 및 등락 업데이트
    document.getElementById('currentPrice').textContent = 
        `${asset.currency === 'KRW' ? '₩' : '$'}${current.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    
    const changeEl = document.getElementById('priceChange');
    changeEl.textContent = `${changePercent > 0 ? '▲' : '▼'} ${Math.abs(changePercent)}% (${currentPeriod})`;
    changeEl.className = `change ${changePercent > 0 ? 'positive' : 'negative'}`;

    // 미래 동향 분석 (RSI 및 이동평균선 시뮬레이션 기반)
    document.getElementById('insightText').innerHTML = generateFutureInsight(key, data, changePercent);
    
    // 통계 업데이트
    document.getElementById('highPriceStat').textContent = Math.max(...data.map(d => d.high)).toLocaleString();
    document.getElementById('lowPriceStat').textContent = Math.min(...data.map(d => d.low)).toLocaleString();
    document.getElementById('riskStat').textContent = asset.risk;
}

function generateFutureInsight(name, data, changePercent) {
    const currentPrice = data[data.length - 1].close;
    const rsiSim = Math.floor(Math.random() * 40) + 30; // RSI 시뮬레이션
    
    let trend = "";
    let action = "";
    
    if (rsiSim > 65) {
        trend = "<span style='color:#ff4d4d'>과매수 국면</span>에 진입했습니다.";
        action = "단기 조정을 대비하여 수익 실현을 고려해볼 시점입니다.";
    } else if (rsiSim < 35) {
        trend = "<span style='color:#00e699'>과매도 구간</span>입니다.";
        action = "기술적 반등이 예상되므로 분할 매수 관점이 유효합니다.";
    } else {
        trend = "현재 <span style='color:#38bdf8'>중립적 추세</span>를 유지하고 있습니다.";
        action = "주요 지지선 이탈 여부를 확인하며 관망하는 전략을 추천합니다.";
    }

    return `<strong>${name}</strong>의 현재 기술적 지표 분석 결과, ${trend}<br><br>향후 5거래일 이내에 현재가 대비 약 <strong>${(Math.random() * 3).toFixed(1)}%</strong> 범위 내의 변동이 예상됩니다. ${action}`;
}

function generateInitialData(basePrice, volatility, count) {
    const data = [];
    let lastClose = basePrice;
    let time = Math.floor(Date.now() / 1000) - (count * 86400);
    
    for (let i = 0; i < count; i++) {
        const change = (Math.random() - 0.5) * (volatility / 10) * lastClose;
        const open = lastClose;
        const close = open + change;
        data.push({
            time: time + (i * 86400),
            open, high: Math.max(open, close) + (Math.random() * 2), low: Math.min(open, close) - (Math.random() * 2), close
        });
        lastClose = close;
    }
    return data;
}

function getPointsByPeriod(period) {
    const map = { '1D': 24, '1W': 7, '1M': 30, '1Y': 365, 'ALL': 730 };
    return map[period] || 30;
}

function handleSearch(query) {
    const key = Object.keys(assetDatabase).find(k => k.toLowerCase() === query.toLowerCase() || assetDatabase[k].symbol.toLowerCase() === query.toLowerCase());
    if (key) {
        document.getElementById('welcomeScreen').classList.add('hidden');
        document.getElementById('marketView').classList.add('hidden');
        document.getElementById('assetDetail').classList.remove('hidden');
        document.getElementById('surveyView').classList.add('hidden');
        document.getElementById('commentsView').classList.add('hidden');
        document.getElementById('calculatorView').classList.add('hidden');
        
        document.getElementById('assetName').textContent = key;
        document.getElementById('assetSymbol').textContent = assetDatabase[key].symbol;
        document.getElementById('assetCategory').textContent = assetDatabase[key].category;
        
        startSimulation(key);
    }
}

function initNavigation() {
    document.querySelectorAll('#mainNav li').forEach(li => {
        li.addEventListener('click', () => {
            document.querySelectorAll('#mainNav li').forEach(l => l.classList.remove('active'));
            li.classList.add('active');
            
            // 모든 뷰 숨기기
            document.getElementById('assetDetail').classList.add('hidden');
            document.getElementById('marketView').classList.add('hidden');
            document.getElementById('welcomeScreen').classList.add('hidden');
            document.getElementById('surveyView').classList.add('hidden');
            document.getElementById('commentsView').classList.add('hidden');
            document.getElementById('calculatorView').classList.add('hidden');

            if (li.dataset.view === 'home') {
                document.getElementById('welcomeScreen').classList.remove('hidden');
            } else if (li.dataset.view === 'market') {
                showMarketView(li.dataset.filter);
            } else if (li.dataset.view === 'survey') {
                document.getElementById('surveyView').classList.remove('hidden');
            } else if (li.dataset.view === 'comments') {
                document.getElementById('commentsView').classList.remove('hidden');
                if (window.DISQUS) {
                    DISQUS.reset({
                        reload: true,
                        config: disqus_config
                    });
                }
            } else if (li.dataset.view === 'calculator') {
                document.getElementById('calculatorView').classList.remove('hidden');
                calculateCompound(); // 뷰 진입 시 자동 계산
            }
        });
    });
}

function showMarketView(filter) {
    document.getElementById('welcomeScreen').classList.add('hidden');
    document.getElementById('assetDetail').classList.add('hidden');
    document.getElementById('surveyView').classList.add('hidden');
    document.getElementById('commentsView').classList.add('hidden');
    document.getElementById('calculatorView').classList.add('hidden');
    document.getElementById('marketView').classList.remove('hidden');
    document.getElementById('marketTitle').textContent = `${filter} 시장 현황`;
    
    const grid = document.getElementById('marketGrid');
    grid.innerHTML = '';
    
    Object.keys(assetDatabase).filter(k => assetDatabase[k].category === filter).forEach(key => {
        const asset = assetDatabase[key];
        const card = document.createElement('div');
        card.className = 'asset-card';
        card.innerHTML = `<h3>${key}</h3><p class="symbol">${asset.symbol}</p><p class="card-price">${asset.currency === 'KRW' ? '₩' : '$'}${asset.basePrice.toLocaleString()}</p>`;
        card.onclick = () => handleSearch(key);
        grid.appendChild(card);
    });
}

// 즐겨찾기 (LocalStorage 기반)
function renderFavorites() {
    const list = document.getElementById('favoriteList');
    list.innerHTML = favorites.length ? favorites.map(f => `<li onclick="handleSearch('${f}')"><span>★ ${f}</span></li>`).join('') : '<li class="empty-msg">자산을 추가하세요</li>';
}

function toggleFavorite() {
    if (!currentAssetKey) return;
    const index = favorites.indexOf(currentAssetKey);
    index === -1 ? favorites.push(currentAssetKey) : favorites.splice(index, 1);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    renderFavorites();
    handleSearch(currentAssetKey);
}
