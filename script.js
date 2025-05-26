const appId = 74510;
let ws;
let currentSymbol = 'R_100';
let lastPrice = null;

const priceDisplay = document.getElementById('price');
const trendDisplay = document.getElementById('trend');
const logDisplay = document.getElementById('log');
const symbolSelect = document.getElementById('symbol');

function connect(symbol) {
  if (ws) ws.close();

  ws = new WebSocket(`wss://ws.binaryws.com/websockets/v3?app_id=${appId}`);

  ws.onopen = () => {
    ws.send(JSON.stringify({ ticks: symbol }));
  };

  ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data);
    if (data.tick) {
      const price = parseFloat(data.tick.quote).toFixed(5);
      priceDisplay.textContent = price;

      if (lastPrice !== null) {
        if (price > lastPrice) {
          trendDisplay.textContent = 'Trend: Rising ↑';
          trendDisplay.style.color = '#00ff99';
        } else if (price < lastPrice) {
          trendDisplay.textContent = 'Trend: Falling ↓';
          trendDisplay.style.color = '#ff5050';
        } else {
          trendDisplay.textContent = 'Trend: No Change';
          trendDisplay.style.color = '#ccc';
        }
      }
      lastPrice = price;
    }
  };
}

function buy(contractType) {
  const api = new WebSocket(`wss://ws.binaryws.com/websockets/v3?app_id=${appId}`);

  api.onopen = () => {
    api.send(JSON.stringify({
      proposal: 1,
      amount: 1,
      basis: 'stake',
      contract_type: contractType,
      currency: 'USD',
      duration: 1,
      duration_unit: 'm',
      symbol: currentSymbol
    }));
  };

  api.onmessage = (msg) => {
    const data = JSON.parse(msg.data);
    if (data.proposal) {
      const id = data.proposal.id;
      log(`Buying ${contractType} at $1...`);
      api.send(JSON.stringify({ buy: id, price: 1 }));
    } else if (data.buy) {
      log(`Trade executed! Contract ID: ${data.buy.contract_id}`);
    } else if (data.error) {
      log(`Error: ${data.error.message}`);
    }
  };
}

function log(message) {
  const time = new Date().toLocaleTimeString();
  logDisplay.textContent = `[${time}] ${message}\n` + logDisplay.textContent;
}

// Event listeners
symbolSelect.addEventListener('change', (e) => {
  currentSymbol = e.target.value;
  lastPrice = null;
  connect(currentSymbol);
});

document.getElementById('buy-rise').addEventListener('click', () => buy('CALL'));
document.getElementById('buy-fall').addEventListener('click', () => buy('PUT'));

// Initialize
connect(currentSymbol);