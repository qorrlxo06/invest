// 글로벌 인덱스 & ETF 데이터베이스 확장
const assetDatabase = {
    // 글로벌 지수 (Index)
    'S&P500': { symbol: 'SPX', category: '지수', basePrice: 5100, currency: 'USD', volatility: 0.9, risk: '보통' },
    '나스닥100': { symbol: 'NDX', category: '지수', basePrice: 18000, currency: 'USD', volatility: 1.4, risk: '높음' },
    '다우존스': { symbol: 'DJI', category: '지수', basePrice: 39000, currency: 'USD', volatility: 0.7, risk: '낮음' },
    '코스피200': { symbol: 'KOSPI200', category: '지수', basePrice: 350, currency: 'KRW', volatility: 1.1, risk: '보통' },
    
    // 주요 ETF
    'SPY': { symbol: 'SPY', category: 'ETF', basePrice: 510, currency: 'USD', volatility: 0.9, risk: '보통', desc: 'S&P 500 지수를 추종하는 세계 최대 ETF' },
    'QQQ': { symbol: 'QQQ', category: 'ETF', basePrice: 440, currency: 'USD', volatility: 1.4, risk: '높음', desc: '나스닥 100 지수를 추종하는 기술주 중심 ETF' },
    'SCHD': { symbol: 'SCHD', category: 'ETF', basePrice: 80, currency: 'USD', volatility: 0.6, risk: '낮음', desc: '미국 배당성장주에 투자하는 대표적 배당 ETF' },
    'SOXX': { symbol: 'SOXX', category: 'ETF', basePrice: 220, currency: 'USD', volatility: 2.5, risk: '매우 높음', desc: '필라델피아 반도체 지수를 추종하는 ETF' },
    'ARKK': { symbol: 'ARKK', category: 'ETF', basePrice: 45, currency: 'USD', volatility: 3.8, risk: '매우 높음', desc: '캐시 우드의 혁신 기술주 집중 투자 ETF' },
    'VNQ': { symbol: 'VNQ', category: 'ETF', basePrice: 85, currency: 'USD', volatility: 1.2, risk: '보통', desc: '미국 리츠(부동산)에 투자하는 ETF' },
    
    // 기존 주식 & 코인 보존
    '삼성전자': { symbol: '005930.KS', category: '국내 주식', basePrice: 75000, currency: 'KRW', volatility: 1.2, risk: '보통' },
    'Tesla': { symbol: 'TSLA', category: '해외 주식', basePrice: 175, currency: 'USD', volatility: 3.5, risk: '높음' },
    'Nvidia': { symbol: 'NVDA', category: '해외 주식', basePrice: 900, currency: 'USD', volatility: 4.0, risk: '매우 높음' },
    '비트코인': { symbol: 'BTC', category: '암호화폐', basePrice: 95000000, currency: 'KRW', volatility: 4.5, risk: '매우 높음' },
    '금': { symbol: 'GOLD', category: '원자재', basePrice: 2350, currency: 'USD', volatility: 0.8, risk: '낮음' }
};

let chart = null;
let candleSeries = null;
let currentAssetKey = null;
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

document.addEventListener('DOMContentLoaded', () => {
    initChart();
    renderFavorites();
    
    document.getElementById('assetSearch').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch(e.target.value);
    });

    document.getElementById('favBtn').addEventListener('click', toggleFavorite);
    
    // 메뉴 클릭 시 웰컴 스크린으로
    document.getElementById('menuSearch').addEventListener('click', () => {
        document.getElementById('assetDetail').classList.add('hidden');
        document.getElementById('welcomeScreen').classList.remove('hidden');
    });
});

function initChart() {
    const chartContainer = document.getElementById('mainChart');
    chart = LightweightCharts.createChart(chartContainer, {
        layout: { background: { color: '#161a1e' }, textColor: '#94a3b8' },
        grid: { vertLines: { color: '#2b2f36' }, horzLines: { color: '#2b2f36' } },
        timeScale: { borderColor: '#2b2f36' },
    });
    candleSeries = chart.addCandlestickSeries({
        upColor: '#00c087', downColor: '#ff3b30', borderVisible: false,
        wickUpColor: '#00c087', wickDownColor: '#ff3b30',
    });
    window.addEventListener('resize', () => {
        chart.applyOptions({ width: chartContainer.clientWidth });
    });
}

function handleSearch(query) {
    const key = Object.keys(assetDatabase).find(k => 
        k.toLowerCase() === query.toLowerCase() || 
        assetDatabase[k].symbol.toLowerCase() === query.toLowerCase()
    );

    if (key) {
        currentAssetKey = key;
        showAssetDetail(key);
    } else {
        alert('검색 결과가 없습니다. (S&P500, QQQ, SCHD 등을 검색해보세요)');
    }
}

function showAssetDetail(key) {
    const asset = assetDatabase[key];
    document.getElementById('welcomeScreen').classList.add('hidden');
    document.getElementById('assetDetail').classList.remove('hidden');
    
    document.getElementById('assetName').textContent = key;
    document.getElementById('assetSymbol').textContent = asset.symbol;
    document.getElementById('assetCategory').textContent = asset.category;
    document.getElementById('riskStat').textContent = asset.risk;
    
    // 즐겨찾기 상태
    const favBtn = document.getElementById('favBtn');
    favBtn.innerHTML = favorites.includes(key) ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>';
    favBtn.classList.toggle('active', favorites.includes(key));

    // 데이터 생성 및 차트 렌더링
    const candleData = generateCandleData(asset.basePrice, asset.volatility);
    candleSeries.setData(candleData);
    chart.timeScale().fitContent();

    // 가격 및 인사이트
    const last = candleData[candleData.length - 1];
    const prev = candleData[candleData.length - 2];
    const change = ((last.close - prev.close) / prev.close * 100).toFixed(2);
    
    document.getElementById('currentPrice').textContent = 
        `${asset.currency === 'KRW' ? '₩' : '$'}${last.close.toLocaleString(undefined, {maximumFractionDigits: 2})}`;
    
    const changeEl = document.getElementById('priceChange');
    changeEl.textContent = `${change > 0 ? '+' : ''}${change}%`;
    changeEl.className = `change ${change > 0 ? 'positive' : 'negative'}`;

    document.getElementById('insightText').innerHTML = generateAdvancedInsight(key, candleData, asset);
    document.getElementById('highPriceStat').textContent = Math.max(...candleData.map(d => d.high)).toLocaleString();
    document.getElementById('lowPriceStat').textContent = Math.min(...candleData.map(d => d.low)).toLocaleString();
}

function generateAdvancedInsight(name, data, asset) {
    const last = data[data.length - 1];
    const first = data[0];
    const totalReturn = ((last.close - first.close) / first.close * 100).toFixed(2);
    
    let analysis = "";
    if (asset.category === '지수' || asset.category === 'ETF') {
        analysis = `이 자산은 <strong>글로벌 거시 경제</strong> 지표와 연동성이 높습니다. 현재 ${totalReturn}% 변동을 보이고 있으며, ${asset.risk} 수준의 리스크를 동반합니다.`;
    } else {
        analysis = `개별 종목 특성상 변동성이 존재하며, 현재 기술적 지표는 ${totalReturn > 0 ? '상승' : '하락'} 압력을 나타내고 있습니다.`;
    }

    return `<strong>${name}</strong> 분석 리포트:<br>${analysis}<br><br>최근 캔들 패턴 분석 결과, 주요 지지선에서 강한 반등이 포착되었습니다. ${asset.desc || ''}`;
}

function generateCandleData(basePrice, volatility, count = 100) {
    const data = [];
    let lastClose = basePrice;
    const now = new Date();
    for (let i = count; i > 0; i--) {
        const time = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const change = (Math.random() - 0.5) * (volatility / 100) * lastClose;
        const open = lastClose;
        const close = open + change;
        data.push({
            time: time.toISOString().split('T')[0],
            open, high: Math.max(open, close) + 2, low: Math.min(open, close) - 2, close
        });
        lastClose = close;
    }
    return data;
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
    list.innerHTML = favorites.length ? favorites.map(key => `
        <li onclick="handleSearch('${key}')">
            <span><i class="fas fa-star" style="color:#facc15"></i> ${key}</span>
            <small>${assetDatabase[key].symbol}</small>
        </li>
    `).join('') : '<li class="empty-msg">추가된 자산이 없습니다.</li>';
}
