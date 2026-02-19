// 확장된 자산 데이터베이스
const assetDatabase = {
    // 국내 주식
    '삼성전자': { symbol: '005930.KS', category: '국내 주식', basePrice: 75000, currency: 'KRW', volatility: 1.2 },
    'SK하이닉스': { symbol: '000660.KS', category: '국내 주식', basePrice: 180000, currency: 'KRW', volatility: 2.5 },
    'NAVER': { symbol: '035420.KS', category: '국내 주식', basePrice: 190000, currency: 'KRW', volatility: 1.8 },
    
    // 해외 주식
    'Apple': { symbol: 'AAPL', category: '해외 주식', basePrice: 185, currency: 'USD', volatility: 1.5 },
    'Tesla': { symbol: 'TSLA', category: '해외 주식', basePrice: 175, currency: 'USD', volatility: 3.5 },
    'Nvidia': { symbol: 'NVDA', category: '해외 주식', basePrice: 850, currency: 'USD', volatility: 4.0 },
    'Microsoft': { symbol: 'MSFT', category: '해외 주식', basePrice: 420, currency: 'USD', volatility: 1.2 },
    
    // 암호화폐
    '비트코인': { symbol: 'BTC', category: '암호화폐', basePrice: 95000000, currency: 'KRW', volatility: 4.5 },
    '이더리움': { symbol: 'ETH', category: '암호화폐', basePrice: 4500000, currency: 'KRW', volatility: 5.0 },
    'Solana': { symbol: 'SOL', category: '암호화폐', basePrice: 200000, currency: 'KRW', volatility: 7.0 },
    
    // 원자재
    '금': { symbol: 'GOLD', category: '원자재', basePrice: 2350, currency: 'USD', volatility: 0.8 },
    '은': { symbol: 'SILVER', category: '원자재', basePrice: 28, currency: 'USD', volatility: 1.5 },
    '유가(WTI)': { symbol: 'WTI', category: '원자재', basePrice: 85, currency: 'USD', volatility: 2.2 }
};

let chart = null;
let candleSeries = null;
let currentAssetKey = null;
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    initChart();
    renderFavorites();
    
    // 검색 이벤트
    document.getElementById('assetSearch').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch(e.target.value);
    });

    // 즐겨찾기 버튼 이벤트
    document.getElementById('favBtn').addEventListener('click', toggleFavorite);
});

function initChart() {
    const chartContainer = document.getElementById('mainChart');
    chart = LightweightCharts.createChart(chartContainer, {
        layout: {
            background: { color: '#161a1e' },
            textColor: '#94a3b8',
        },
        grid: {
            vertLines: { color: '#2b2f36' },
            horzLines: { color: '#2b2f36' },
        },
        crosshair: {
            mode: LightweightCharts.CrosshairMode.Normal,
        },
        rightPriceScale: {
            borderColor: '#2b2f36',
        },
        timeScale: {
            borderColor: '#2b2f36',
            timeVisible: true,
        },
    });

    candleSeries = chart.addCandlestickSeries({
        upColor: '#00c087',
        downColor: '#ff3b30',
        borderVisible: false,
        wickUpColor: '#00c087',
        wickDownColor: '#ff3b30',
    });

    window.addEventListener('resize', () => {
        chart.applyOptions({ width: chartContainer.clientWidth });
    });
}

// 캔들 데이터 생성기 (시뮬레이션)
function generateCandleData(basePrice, volatility, count = 100) {
    const data = [];
    let lastClose = basePrice;
    const now = new Date();
    
    for (let i = count; i > 0; i--) {
        const time = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const change = (Math.random() - 0.5) * (volatility / 100) * lastClose;
        const open = lastClose;
        const close = open + change;
        const high = Math.max(open, close) + Math.random() * (volatility / 200) * lastClose;
        const low = Math.min(open, close) - Math.random() * (volatility / 200) * lastClose;
        
        data.push({
            time: time.toISOString().split('T')[0],
            open, high, low, close
        });
        lastClose = close;
    }
    return data;
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
        alert('검색 결과가 없습니다. (삼성전자, Tesla, BTC, GOLD 등)');
    }
}

function showAssetDetail(key) {
    const asset = assetDatabase[key];
    document.getElementById('welcomeScreen').classList.add('hidden');
    document.getElementById('assetDetail').classList.remove('hidden');
    
    document.getElementById('assetName').textContent = key;
    document.getElementById('assetSymbol').textContent = asset.symbol;
    document.getElementById('assetCategory').textContent = asset.category;
    
    // 즐겨찾기 버튼 상태 업데이트
    const favBtn = document.getElementById('favBtn');
    if (favorites.includes(key)) {
        favBtn.classList.add('active');
        favBtn.innerHTML = '<i class="fas fa-star"></i>';
    } else {
        favBtn.classList.remove('active');
        favBtn.innerHTML = '<i class="far fa-star"></i>';
    }

    const candleData = generateCandleData(asset.basePrice, asset.volatility);
    candleSeries.setData(candleData);
    chart.timeScale().fitContent();

    // 가격 정보 업데이트
    const lastCandle = candleData[candleData.length - 1];
    const prevCandle = candleData[candleData.length - 2];
    const changePercent = ((lastCandle.close - prevCandle.close) / prevCandle.close * 100).toFixed(2);
    
    document.getElementById('currentPrice').textContent = 
        `${asset.currency === 'KRW' ? '₩' : '$'}${lastCandle.close.toLocaleString(undefined, {maximumFractionDigits: 2})}`;
    
    const changeEl = document.getElementById('priceChange');
    changeEl.textContent = `${changePercent > 0 ? '+' : ''}${changePercent}%`;
    changeEl.className = `change ${changePercent > 0 ? 'positive' : 'negative'}`;

    // 인사이트 및 통계
    document.getElementById('insightText').innerHTML = generateInsight(key, candleData);
    document.getElementById('volatilityStat').textContent = `${asset.volatility}%`;
    document.getElementById('highPriceStat').textContent = Math.max(...candleData.map(d => d.high)).toLocaleString();
    document.getElementById('lowPriceStat').textContent = Math.min(...candleData.map(d => d.low)).toLocaleString();
}

function generateInsight(name, data) {
    const last = data[data.length - 1];
    const first = data[0];
    const totalReturn = ((last.close - first.close) / first.close * 100).toFixed(2);
    
    let advice = "";
    if (totalReturn > 15) {
        advice = "<strong>추세 분석:</strong> 강력한 상승 추세입니다. 캔들의 꼬리가 짧아 매수세가 여전히 강합니다.";
    } else if (totalReturn < -15) {
        advice = "<strong>추세 분석:</strong> 과매도 구간입니다. 하락 캔들의 크기가 줄어드는 지점을 변곡점으로 주시하세요.";
    } else {
        advice = "<strong>추세 분석:</strong> 횡보 장세입니다. 볼린저 밴드 상단 돌파나 지지선 이탈 여부가 중요합니다.";
    }

    return `${name}의 최근 수익률은 ${totalReturn}% 입니다. <br><br> ${advice} <br><br> 과거 패턴 상 현재 위치는 중장기 이동평균선 상단에 위치하여 안정적인 흐름을 보입니다.`;
}

// 즐겨찾기 로직
function toggleFavorite() {
    if (!currentAssetKey) return;
    
    const index = favorites.indexOf(currentAssetKey);
    if (index === -1) {
        favorites.push(currentAssetKey);
    } else {
        favorites.splice(index, 1);
    }
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
    showAssetDetail(currentAssetKey);
    renderFavorites();
}

function renderFavorites() {
    const list = document.getElementById('favoriteList');
    if (favorites.length === 0) {
        list.innerHTML = '<li class="empty-msg">추가된 자산이 없습니다.</li>';
        return;
    }

    list.innerHTML = favorites.map(key => `
        <li onclick="handleSearch('${key}')">
            <span><i class="fas fa-star" style="color:#facc15"></i> ${key}</span>
            <small>${assetDatabase[key].symbol}</small>
        </li>
    `).join('');
}
