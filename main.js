// 가상 데이터베이스 (Mock Data)
const assetDatabase = {
    '삼성전자': {
        symbol: '005930.KS',
        category: '국내 주식',
        basePrice: 72000,
        currency: 'KRW',
        description: '대한민국 최대의 반도체 및 전자제품 제조사입니다.',
        trend: 'up',
        volatility: 12.5
    },
    '비트코인': {
        symbol: 'BTC/USDT',
        category: '암호화폐',
        basePrice: 95000000,
        currency: 'KRW',
        description: '가장 대표적인 탈중앙화 디지털 자산입니다.',
        trend: 'volatile',
        volatility: 45.2
    },
    'Apple': {
        symbol: 'AAPL.US',
        category: '해외 주식',
        basePrice: 190,
        currency: 'USD',
        description: '아이폰, 맥북 등을 제조하는 글로벌 IT 기업입니다.',
        trend: 'up',
        volatility: 15.8
    },
    '금': {
        symbol: 'GOLD',
        category: '원자재',
        basePrice: 2800,
        currency: 'USD',
        description: '전통적인 안전 자산으로 인플레이션 헤지 수단입니다.',
        trend: 'stable',
        volatility: 8.4
    }
};

let mainChart = null;

// 데이터 생성기 (시뮬레이션)
function generateHistoryData(basePrice, volatility, points = 100) {
    let data = [];
    let current = basePrice;
    const labels = [];
    
    for (let i = 0; i < points; i++) {
        const change = (Math.random() - 0.5) * (volatility / 100) * current;
        current += change;
        data.push(current);
        labels.push(`${i}D ago`);
    }
    return { data: data.reverse(), labels: labels.reverse() };
}

// 인사이트 생성 엔진
function generateInsight(assetName, data, trend) {
    const lastPrice = data[data.length - 1];
    const firstPrice = data[0];
    const totalReturn = ((lastPrice - firstPrice) / firstPrice * 100).toFixed(2);
    
    let advice = "";
    if (totalReturn > 10) {
        advice = "최근 강력한 상승 모멘텀을 보이고 있습니다. 전고점 돌파 여부를 주목하세요.";
    } else if (totalReturn < -10) {
        advice = "단기 과매도 구간에 진입한 것으로 보입니다. 분할 매수 관점에서 접근이 유효할 수 있습니다.";
    } else {
        advice = "현재 박스권 횡보 구간입니다. 주요 이평선 지지 여부를 확인하며 관망하는 전략을 추천합니다.";
    }

    return `<strong>${assetName}</strong>은(는) 지난 기간 동안 약 <strong>${totalReturn}%</strong>의 수익률을 기록했습니다. <br><br> ${advice} 과거 패턴 분석 결과, 현재는 ${trend === 'volatile' ? '변동성이 매우 높은' : '안정적인'} 흐름을 보이고 있어 신중한 대응이 필요합니다.`;
}

// 검색 핸들러
function handleSearch(query) {
    const welcomeScreen = document.getElementById('welcomeScreen');
    const assetDetail = document.getElementById('assetDetail');
    
    const asset = assetDatabase[query] || Object.values(assetDatabase).find(a => a.symbol.includes(query.toUpperCase()));

    if (asset) {
        welcomeScreen.classList.add('hidden');
        assetDetail.classList.remove('hidden');
        renderAsset(query, asset);
    } else {
        alert('해당 자산을 찾을 수 없습니다. (삼성전자, 비트코인, Apple, 금 등으로 검색해보세요)');
    }
}

// 화면 렌더링
function renderAsset(name, asset) {
    document.getElementById('assetName').textContent = name;
    document.getElementById('assetSymbol').textContent = asset.symbol;
    document.getElementById('assetCategory').textContent = asset.category;
    
    const history = generateHistoryData(asset.basePrice, asset.volatility);
    const currentPrice = history.data[history.data.length - 1];
    const prevPrice = history.data[history.data.length - 2];
    const changePercent = ((currentPrice - prevPrice) / prevPrice * 100).toFixed(2);

    document.getElementById('currentPrice').textContent = 
        `${asset.currency === 'KRW' ? '₩' : '$'}${currentPrice.toLocaleString(undefined, {maximumFractionDigits: 2})}`;
    
    const changeEl = document.getElementById('priceChange');
    changeEl.textContent = `${changePercent > 0 ? '+' : ''}${changePercent}%`;
    changeEl.className = `change ${changePercent > 0 ? 'positive' : 'negative'}`;

    // 차트 업데이트
    updateChart(history.labels, history.data);

    // 인사이트 업데이트
    document.getElementById('insightText').innerHTML = generateInsight(name, history.data, asset.trend);
    
    // 통계 업데이트
    document.getElementById('volatilityStat').textContent = `${asset.volatility}%`;
    document.getElementById('highPriceStat').textContent = Math.max(...history.data).toLocaleString(undefined, {maximumFractionDigits: 0});
    document.getElementById('lowPriceStat').textContent = Math.min(...history.data).toLocaleString(undefined, {maximumFractionDigits: 0});
}

function updateChart(labels, data) {
    const ctx = document.getElementById('mainChart').getContext('2d');
    
    if (mainChart) {
        mainChart.destroy();
    }

    mainChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '가격 추이',
                data: data,
                borderColor: '#38bdf8',
                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { display: false },
                y: {
                    grid: { color: '#334155' },
                    ticks: { color: '#94a3b8' }
                }
            }
        }
    });
}

// 이벤트 리스너
document.getElementById('assetSearch').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSearch(e.target.value);
    }
});

// 타임 버튼 클릭 이벤트 (데모용)
document.querySelectorAll('.time-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        // 실제 데이터라면 여기서 기간별 API 호출
    });
});
