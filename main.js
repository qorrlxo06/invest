// 고도화된 자산 데이터베이스 및 상태 관리
const assetDatabase = {
    'S&P500': { symbol: 'SPX', category: '지수', basePrice: 5120, currency: 'USD', volatility: 0.8, risk: '보통' },
    '나스닥100': { symbol: 'NDX', category: '지수', basePrice: 18200, currency: 'USD', volatility: 1.3, risk: '높음' },
    'QQQ': { symbol: 'QQQ', category: 'ETF', basePrice: 445, currency: 'USD', volatility: 1.4, risk: '높음' },
    'SPY': { symbol: 'SPY', category: 'ETF', basePrice: 512, currency: 'USD', volatility: 0.8, risk: '보통' },
    'SCHD': { symbol: 'SCHD', category: 'ETF', basePrice: 82, currency: 'USD', volatility: 0.5, risk: '낮음' },
    '삼성전자': { symbol: '005930.KS', category: '국내 주식', basePrice: 78000, currency: 'KRW', volatility: 1.2, risk: '보통' },
    'Tesla': { symbol: 'TSLA', category: '해외 주식', basePrice: 172, currency: 'USD', volatility: 3.5, risk: '높음' },
    'Nvidia': { symbol: 'NVDA', category: '해외 주식', basePrice: 920, currency: 'USD', volatility: 4.2, risk: '매우 높음' },
    '비트코인': { symbol: 'BTC', category: '암호화폐', basePrice: 96000000, currency: 'KRW', volatility: 4.0, risk: '매우 높음' },
    '이더리움': { symbol: 'ETH', category: '암호화폐', basePrice: 5200000, currency: 'KRW', volatility: 4.8, risk: '매우 높음' }
};

let chart = null;
let candleSeries = null;
let currentAssetKey = null;
let currentPeriod = '1M';
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

document.addEventListener('DOMContentLoaded', () => {
    initChart();
    renderFavorites();
    initNavigation();
    
    // 검색
    document.getElementById('assetSearch').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch(e.target.value);
    });

    // 즐겨찾기
    document.getElementById('favBtn').addEventListener('click', toggleFavorite);

    // 기간 선택 버튼 이벤트 리스너 (실제 기능 구현)
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentPeriod = btn.dataset.period;
            if (currentAssetKey) showAssetDetail(currentAssetKey);
        });
    });
});

function initChart() {
    const chartContainer = document.getElementById('mainChart');
    chart = LightweightCharts.createChart(chartContainer, {
        layout: { background: { color: '#11141d' }, textColor: '#94a3b8' },
        grid: { vertLines: { color: '#222834' }, horzLines: { color: '#222834' } },
        timeScale: { borderColor: '#222834' },
    });
    candleSeries = chart.addCandlestickSeries({
        upColor: '#00e699', downColor: '#ff4d4d', borderVisible: false,
        wickUpColor: '#00e699', wickDownColor: '#ff4d4d',
    });
    window.addEventListener('resize', () => chart.applyOptions({ width: chartContainer.clientWidth }));
}

// 네비게이션 및 카테고리 필터링 구현
function initNavigation() {
    document.querySelectorAll('#mainNav li').forEach(li => {
        li.addEventListener('click', () => {
            document.querySelectorAll('#mainNav li').forEach(l => l.classList.remove('active'));
            li.classList.add('active');
            
            const view = li.dataset.view;
            const filter = li.dataset.filter;

            if (view === 'home') {
                showView('welcomeScreen');
            } else if (view === 'market') {
                showMarketView(filter);
            }
        });
    });
}

function showView(viewId) {
    document.querySelectorAll('.view-content').forEach(v => v.classList.add('hidden'));
    document.getElementById(viewId).classList.remove('hidden');
}

function showMarketView(category) {
    showView('marketView');
    document.getElementById('marketTitle').textContent = `${category} 시장 현황`;
    const grid = document.getElementById('marketGrid');
    grid.innerHTML = '';

    Object.keys(assetDatabase).filter(key => assetDatabase[key].category === category).forEach(key => {
        const asset = assetDatabase[key];
        const card = document.createElement('div');
        card.className = 'asset-card';
        card.innerHTML = `
            <div class="card-top">
                <h3>${key}</h3>
                <span class="symbol">${asset.symbol}</span>
            </div>
            <div class="card-price">${asset.currency === 'KRW' ? '₩' : '$'}${asset.basePrice.toLocaleString()}</div>
            <div class="category-tag" style="margin-top:10px">${asset.category}</div>
        `;
        card.onclick = () => handleSearch(key);
        grid.appendChild(card);
    });
}

// 기간에 따른 실제 데이터 양 조절 로직
function getPointsByPeriod(period) {
    switch(period) {
        case '1D': return 24;  // 24시간
        case '1W': return 7;   // 7일
        case '1M': return 30;  // 30일
        case '1Y': return 365; // 365일
        case 'ALL': return 1000;
        default: return 30;
    }
}

function showAssetDetail(key) {
    const asset = assetDatabase[key];
    currentAssetKey = key;
    showView('assetDetail');
    
    document.getElementById('assetName').textContent = key;
    document.getElementById('assetSymbol').textContent = asset.symbol;
    document.getElementById('assetCategory').textContent = asset.category;
    document.getElementById('riskStat').textContent = asset.risk;
    
    // 즐겨찾기 아이콘
    const favBtn = document.getElementById('favBtn');
    favBtn.innerHTML = favorites.includes(key) ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>';
    favBtn.classList.toggle('active', favorites.includes(key));

    // 실제 기간 데이터 생성
    const points = getPointsByPeriod(currentPeriod);
    const candleData = generateCandleData(asset.basePrice, asset.volatility, points);
    candleSeries.setData(candleData);
    chart.timeScale().fitContent();

    // 현재 가격 및 변동률
    const last = candleData[candleData.length - 1];
    const prev = candleData[0];
    const change = ((last.close - prev.close) / prev.close * 100).toFixed(2);
    
    document.getElementById('currentPrice').textContent = 
        `${asset.currency === 'KRW' ? '₩' : '$'}${last.close.toLocaleString(undefined, {maximumFractionDigits: 2})}`;
    
    const changeEl = document.getElementById('priceChange');
    changeEl.textContent = `${change > 0 ? '+' : ''}${change}% (${currentPeriod})`;
    changeEl.className = `change ${change > 0 ? 'positive' : 'negative'}`;

    document.getElementById('insightText').innerHTML = `<strong>${key}</strong>의 ${currentPeriod} 분석 리포트:<br>해당 기간 동안 <strong>${change}%</strong>의 수익률을 기록 중입니다. 리스크 등급은 <strong>${asset.risk}</strong>이며, 현재 기술적 지표상 ${change > 0 ? '강세' : '약세'} 구간에 있습니다.`;
    document.getElementById('highPriceStat').textContent = Math.max(...candleData.map(d => d.high)).toLocaleString();
    document.getElementById('lowPriceStat').textContent = Math.min(...candleData.map(d => d.low)).toLocaleString();
}

function generateCandleData(basePrice, volatility, count) {
    const data = [];
    let lastClose = basePrice;
    const now = new Date();
    for (let i = count; i > 0; i--) {
        const time = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const change = (Math.random() - 0.5) * (volatility / 50) * lastClose;
        const open = lastClose;
        const close = open + change;
        data.push({
            time: time.toISOString().split('T')[0],
            open, high: Math.max(open, close) + (Math.random() * 5), low: Math.min(open, close) - (Math.random() * 5), close
        });
        lastClose = close;
    }
    return data;
}

function handleSearch(query) {
    const key = Object.keys(assetDatabase).find(k => k.toLowerCase() === query.toLowerCase() || assetDatabase[k].symbol.toLowerCase() === query.toLowerCase());
    if (key) showAssetDetail(key);
    else alert('자산을 찾을 수 없습니다.');
}

function toggleFavorite() {
    if (!currentAssetKey) return;
    const index = favorites.indexOf(currentAssetKey);
    index === -1 ? favorites.push(currentAssetKey) : favorites.splice(index, 1);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    showAssetDetail(currentAssetKey);
    renderFavorites();
}

function renderFavorites() {
    const list = document.getElementById('favoriteList');
    list.innerHTML = favorites.length ? favorites.map(key => `<li onclick="handleSearch('${key}')"><span>★ ${key}</span></li>`).join('') : '<li class="empty-msg">자산을 추가하세요</li>';
}
