<template>
  <div class="dashboard-container">
    <aside class="sidebar">
      <div class="logo">
        <div class="logo-icon">IQ</div>
        <span>IEQI AI-MONITOR</span>
      </div>

      <nav class="nav-menu">
        <div 
          v-for="item in menuItems" 
          :key="item.id"
          :class="['nav-item', { active: currentTab === item.id }]"
          @click="currentTab = item.id"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          {{ item.name }}
        </div>
      </nav>

      <div class="quick-stats">
        <p class="section-label">DEVICE STATUS</p>
        <div class="stat-line"><span>Status</span><span class="status-online">● ONLINE</span></div>
        <div class="stat-line"><span>AI Engine</span><span class="status-online">ACTIVE</span></div>
      </div>
    </aside>

    <main class="main-content">
      <header class="content-header">
        <div>
          <h1>{{ currentMenuName }}</h1>
          <p>Smart Indoor Environment Quality with AI Integration</p>
        </div>
        <div class="ai-badge" v-if="sensorData.temp > 29">⚠️ High Temp Alert</div>
      </header>

      <section v-if="currentTab === 'dashboard'" class="tab-content">
        <div class="stats-grid">
          <div class="card mini-card">
            <p>Temperature</p>
            <div class="value">{{ sensorData.temp }}°C</div>
            <small :class="sensorData.temp > 28 ? 'text-red' : 'text-green'">
              {{ sensorData.temp > 28 ? 'Diatas Rata-rata' : 'Normal' }}
            </small>
          </div>
          <div class="card mini-card">
            <p>Humidity</p>
            <div class="value">{{ sensorData.humidity }}%</div>
            <small>Optimal Range</small>
          </div>
          <div class="card mini-card">
            <p>IEQI Score</p>
            <div class="value">{{ ieqiScore }}/100</div>
            <small class="tag-good">Sangat Baik</small>
          </div>
        </div>

        <div class="charts-grid">
          <div class="card chart-card">
            <h3>Real-time Environment Data</h3>
            <apexchart type="area" height="300" :options="lineChartOptions" :series="lineSeries"></apexchart>
          </div>
        </div>
      </section>

      <section v-if="currentTab === 'analytics'" class="tab-content">
        <div class="analytics-grid">
          <div class="card ai-card">
            <div class="ai-header">
              <span class="ai-icon">🧠</span>
              <h3>Smart AI Detection</h3>
            </div>
            <div class="ai-body">
              <div class="prediction-info">
                <p>Prediksi Suhu (1 Jam ke depan): <strong>{{ predictedTemp }}°C</strong></p>
                <p>Rata-rata Harian: <strong>26.4°C</strong></p>
              </div>
              <div class="prediction-chart">
                <apexchart type="line" height="250" :options="predictionChartOptions" :series="predictionSeries"></apexchart>
              </div>
            </div>
          </div>

          <div class="card insight-card">
            <h3>Environmental Insights</h3>
            <ul class="insight-list">
              <li>✅ Ventilasi ruangan cukup baik hari ini.</li>
              <li>⚠️ Intensitas cahaya (LDR) menurun 15% dari kemarin.</li>
              <li>ℹ️ Jam sibuk panas terdeteksi pada pukul 13:00 - 15:00.</li>
            </ul>
          </div>
        </div>
      </section>

      <section v-if="currentTab === 'control'" class="tab-content">
        <div class="card control-card">
          <h3>Actuator Manual Control</h3>
          <div class="switch-group">
            <label>LED Indicator</label>
            <input type="checkbox" v-model="sensorData.led">
          </div>
          <div class="switch-group">
            <label>Buzzer Alarm</label>
            <input type="checkbox" v-model="sensorData.buzzer">
          </div>
        </div>
      </section>

      <footer class="ai-footer" :class="{ 'warning-bg': sensorData.temp > 29 }">
        <div class="footer-content">
          <span class="bot-icon">🤖 AI Assistant:</span>
          <p class="recommendation-text">{{ aiRecommendation }}</p>
        </div>
      </footer>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import VueApexCharts from "vue3-apexcharts";

const apexchart = VueApexCharts;

// API CONFIG
const API_URL = 'http://localhost:8787/api/ieqi';
const API_KEY = 'sieqi-secret-key-123';

// NAVIGATION
const currentTab = ref('dashboard');
const menuItems = [
  { id: 'dashboard', name: 'Dashboard', icon: '📊' },
  { id: 'analytics', name: 'Advanced Analytics', icon: '🧠' },
  { id: 'control', name: 'Control Center', icon: '⚙️' },
];

const currentMenuName = computed(() => menuItems.find(i => i.id === currentTab.value)?.name);

// SENSOR DATA (Realtime)
const sensorData = ref({
  temp: 0,
  humidity: 0,
  lux: 0,
  led: true,
  buzzer: false
});

const historyData = ref([]);
const ieqiScore = ref(0);
const predictedTemp = ref(0); // Prediksi AI (Placeholder)

// FETCH DATA
const fetchData = async () => {
  try {
    // Fetch Latest
    const latestRes = await fetch(`${API_URL}/latest`, {
      headers: { 'x-api-key': API_KEY }
    });
    if (latestRes.ok) {
      const { data } = await latestRes.json();
      if (data) {
        sensorData.value.temp = data.temperature;
        sensorData.value.humidity = data.humidity;
        sensorData.value.lux = data.light;
        ieqiScore.value = data.ieqi;
        // Simple prediction simulation based on latest temp
        predictedTemp.value = parseFloat((data.temperature + 0.5).toFixed(1));
      }
    }

    // Fetch History
    const historyRes = await fetch(API_URL, {
      headers: { 'x-api-key': API_KEY }
    });
    if (historyRes.ok) {
      const { data } = await historyRes.json();
      historyData.value = data || [];
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

let pollingInterval;
onMounted(() => {
  fetchData();
  pollingInterval = setInterval(fetchData, 5000); // Poll every 5 seconds
});

onUnmounted(() => {
  clearInterval(pollingInterval);
});

// AI RECOMMENDATION LOGIC
const aiRecommendation = computed(() => {
  const temp = sensorData.temp;
  if (temp > 30) {
    return `Suhu saat ini (${temp}°C) sangat panas! AI merekomendasikan untuk menghidupkan AC atau kipas angin dan membuka ventilasi tambahan untuk menghindari dehidrasi.`;
  } else if (temp > 27) {
    return `Suhu mulai meningkat. Disarankan untuk menutup tirai jendela agar panas matahari tidak langsung masuk ke ruangan.`;
  } else if (temp < 22) {
    return `Suhu ruangan cukup dingin. Pastikan sirkulasi udara tetap terjaga agar tidak terlalu lembab.`;
  } else {
    return `Kondisi ruangan sangat ideal. Tetap pertahankan kualitas udara ini!`;
  }
});

// CHART DATA
const lineSeries = computed(() => [{
  name: 'Suhu',
  data: historyData.value.slice(0, 10).reverse().map(d => d.temperature)
}]);

const lineChartOptions = computed(() => ({
  chart: { theme: 'dark', background: 'transparent', toolbar: {show: false} },
  stroke: { curve: 'smooth' },
  colors: ['#3b82f6'],
  xaxis: {
    categories: historyData.value.slice(0, 10).reverse().map(d => new Date(d.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}))
  }
}));

// PREDICTION CHART (Line + Dashed Prediction)
const predictionSeries = [
  { name: 'Data Riwayat', data: [26, 27, 26.5, 28, 30.2, null] },
  { name: 'Prediksi AI', data: [null, null, null, null, 30.2, 31.5] }
];

const predictionChartOptions = {
  chart: { type: 'line', toolbar: {show: false} },
  stroke: { dashArray: [0, 8], width: [3, 3], curve: 'smooth' },
  colors: ['#3b82f6', '#f59e0b'],
  xaxis: { categories: ['10:00', '11:00', '12:00', '13:00', 'Sekarang', 'Nanti'] },
  theme: { mode: 'dark' }
};
</script>

<style>
/* CSS Reset & Variables */
:root {
  --bg-dark: #0f172a;
  --card-bg: #1e293b;
  --accent: #3b82f6;
  --warning: #f59e0b;
  --danger: #ef4444;
}

body { margin: 0; background: var(--bg-dark); color: white; font-family: 'Inter', sans-serif; }

/* Layout */
.dashboard-container { display: flex; height: 100vh; overflow: hidden; }

.sidebar { width: 260px; background: #0b1120; padding: 2rem; display: flex; flex-direction: column; border-right: 1px solid #334155; }

.logo { display: flex; align-items: center; gap: 10px; font-weight: 800; margin-bottom: 2rem; color: var(--accent); }
.logo-icon { background: var(--accent); color: white; padding: 5px 10px; border-radius: 8px; }

.nav-item { padding: 12px; margin-bottom: 10px; cursor: pointer; border-radius: 8px; color: #94a3b8; transition: 0.3s; }
.nav-item:hover, .nav-item.active { background: rgba(59, 130, 246, 0.1); color: white; }
.nav-item.active { border-left: 4px solid var(--accent); font-weight: bold; }

.main-content { flex: 1; padding: 2rem; overflow-y: auto; position: relative; padding-bottom: 100px; }

.content-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
.ai-badge { background: var(--danger); padding: 5px 15px; border-radius: 20px; font-size: 0.8rem; animation: blink 1s infinite; }

/* Cards */
.stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-bottom: 2rem; }
.card { background: var(--card-bg); padding: 1.5rem; border-radius: 16px; border: 1px solid #334155; }
.value { font-size: 2.5rem; font-weight: bold; margin: 10px 0; }

.analytics-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 1.5rem; }
.ai-header { display: flex; align-items: center; gap: 10px; margin-bottom: 1rem; color: var(--warning); }

.insight-list { padding-left: 20px; line-height: 2; color: #cbd5e1; }

/* Footer Recommendation */
.ai-footer {
  position: fixed;
  bottom: 20px;
  right: 20px;
  left: 280px;
  background: #1e293b;
  border: 1px solid var(--accent);
  border-radius: 12px;
  padding: 15px 25px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  transition: 0.5s;
}

.footer-content { display: flex; align-items: center; gap: 15px; }
.bot-icon { font-weight: bold; color: var(--accent); min-width: 120px; }
.recommendation-text { margin: 0; font-size: 0.95rem; }

.warning-bg { border-color: var(--danger); background: rgba(239, 68, 68, 0.1); }
.text-red { color: var(--danger); }
.text-green { color: #10b981; }

@keyframes blink { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }

.switch-group { display: flex; justify-content: space-between; padding: 15px 0; border-bottom: 1px solid #334155; }
</style>