// 定义底图集合
const baseLayers = {
  "OpenStreetMap": new ol.layer.Tile({
    source: new ol.source.OSM(),
    visible: true  // 默认显示OSM
  }),
  "ArcGIS影像": new ol.layer.Tile({
    source: new ol.source.XYZ({
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attributions: '© <a href="https://www.arcgis.com/">ArcGIS</a>'
    }),
    visible: false
  })
};


const map = new ol.Map({
  target: "map",
  layers: [
    baseLayers["OpenStreetMap"], // 初始加入一层
    baseLayers["ArcGIS影像"],    // 先加进去，visible: false，不显示
  ],
  view: new ol.View({
    center: ol.proj.fromLonLat([100.2, 36.9]),
    zoom: 9.5,
  }),
});


document.getElementById('baseLayerSelector').addEventListener('change', function(e) {
  // 先隐藏所有底图
  Object.values(baseLayers).forEach(layer => layer.setVisible(false));
  // 显示选中的底图
  baseLayers[e.target.value].setVisible(true);
});

let featuresByTime = {};
let times = [];
let playing = true; // 自动播放默认开启
let currentIndex = 0; // 初始化当前索引
let intervalId = null; // 存储定时器的ID

fetch("timeseries.geojson")
  .then((res) => res.json())
  .then((data) => {
    const format = new ol.format.GeoJSON();
    const allFeatures = format.readFeatures(data, {
      featureProjection: "EPSG:3857",
    });

    // 假设每个要素有 time 属性
    allFeatures.forEach((f) => {
      const time = f.get("time");
      if (!featuresByTime[time]) {
        featuresByTime[time] = [];
        times.push(time);
      }
      featuresByTime[time].push(f);
    });

    times.sort(); // 按时间排序

    const vectorSource = new ol.source.Vector();
    const vectorLayer = new ol.layer.Vector({
      source: vectorSource,
      style: new ol.style.Style({
        fill: new ol.style.Fill({ color: "rgba(0, 102, 255, 0.4)" }),
        stroke: new ol.style.Stroke({ color: "#0066ff", width: 1 }),
      }),
    });
    map.addLayer(vectorLayer);

    const slider = document.getElementById("timeSlider");
    const label = document.getElementById("timeLabel");
    slider.max = times.length - 1;

    slider.oninput = () => {
      const t = times[slider.value];
      label.textContent = t;
      vectorSource.clear();
      vectorSource.addFeatures(featuresByTime[t]);
    };

    const playPauseBtn = document.getElementById("playPauseBtn");

    // 自动播放函数
    function startPlayback() {
      intervalId = setInterval(() => {
        if (!playing) return;
        currentIndex = (currentIndex + 1) % times.length;
        slider.value = currentIndex;
        slider.oninput();
      }, 500);
    }

    // 控制播放/暂停按钮点击
    playPauseBtn.onclick = () => {
      playing = !playing;
      playPauseBtn.textContent = playing ? "⏸" : "▶";

      if (playing) {
        startPlayback();
      } else {
        clearInterval(intervalId); // 暂停时清除定时器
      }
    };

    // 用户拖动时暂停播放
    slider.addEventListener("mousedown", () => {
      playing = false;
      playPauseBtn.textContent = "▶";
      clearInterval(intervalId); // 清除定时器，停止自动播放
    });

    // 页面加载时直接开始自动播放
    startPlayback();
  });

// 绘制Echart图表
fetch('QHlake.csv')
  .then(res => res.text())
  .then(csvText => {
    const results = Papa.parse(csvText, { header: true });
    const data = results.data;

    const years = data.map(row => row.Year);
    const areas = data.map(row => row.Area);
    const Trend = data.map(row => row.Trend);
    const Seasonal = data.map(row => row.Seasonal);
    const residual = data.map(row => row.resid);

    const myChart1 = echarts.init(document.getElementById('Chart1'));
    myChart1.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: years },
      yAxis: { type: 'value', 
               name: 'Area(km²)',
               splitNumber: 4, // 控制刻度行数，越小越稀疏
               min: 'dataMin',
               max: 'dataMax' },
      series: [{
        type: 'line',
        name: 'Area',
        data: areas,
        smooth: true
      }],
      grid: {
        top: 40,
        bottom: 30,
        left: 60,
        right: 20},
    });

    const myChart2 = echarts.init(document.getElementById('Chart2'));
    myChart2.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: years },
      yAxis: { type: 'value', 
               name: 'Trend(km²)',
               splitNumber: 4, // 控制刻度行数，越小越稀疏
               min: 'dataMin',
               max: 'dataMax' },
      series: [{
        type: 'line',
        name: 'Trend',
        data: Trend,
        smooth: true,
        itemStyle: {
          opacity: 0 // 如果你只是想让点“看不见”而不是去掉
          }
      }],
      grid: {
        top: 40,
        bottom: 30,
        left: 60,
        right: 20},
    });
    const myChart3 = echarts.init(document.getElementById('Chart3'));
      myChart3.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: years },
      yAxis: { type: 'value', 
               name: 'Seanal(km²)',
               splitNumber: 4, // 控制刻度行数，越小越稀疏
               min: 'dataMin',
               max: 'dataMax' },
      series: [{
        type: 'line',
        name: 'Seanal',
        data: Seasonal,
        smooth: true,
        itemStyle: {
          opacity: 0 // 如果你只是想让点“看不见”而不是去掉
          }
      }],
      grid: {
        top: 40,
        bottom: 30,
        left: 60,
        right: 20},
    });
    const myChart4 = echarts.init(document.getElementById('Chart4'));
    myChart4.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: years },
      yAxis: { type: 'value', 
               name: 'Residual(km²)',
               splitNumber: 4, // 控制刻度行数，越小越稀疏
               min: 'dataMin',
               max: 'dataMax' },
      series: [{
        type: 'scatter',
        name: 'Residual',
        data: residual,
        smooth: true,
        symbolSize: 4, // 可调节点的大小
      }],
      grid: {
        top: 40,
        bottom: 30,
        left: 60,
        right: 20},
    });
  });

const text = `青海湖，如一面湛蓝的镜子，镶嵌在高原的胸膛，千百年来静默不语，却在岁月中悄然变幻。
它的湖面曾在岁月中起伏跌宕，宛如大地的呼吸，忽盈忽缩。
自2012年起，那湖水缓缓上升，不是因外力所致，
而是高原天空中微妙而持久的回响——气温上升，冰川消融，降水丰沛，
这场悄然无声的气候变化，在青海湖的波光里悄然浮现。
湖水漫过旧日的边界，像是在缓慢书写一首气候的诗。
那一圈圈扩展的涟漪，正是地球温度上升留下的痕迹。`;

const target = document.getElementById("lakeinfo");

let index = 0;

function typeText() {
  if (index < text.length) {
    const char = text.charAt(index);
    // 如果是换行符，就加 <br>，否则加字符
    if (char === '\n') {
      target.innerHTML += '<br>';
    } else {
      target.innerHTML += char;
    }
    index++;
    setTimeout(typeText, 50); // 打字速度
  }
}

// 启动打字机效果
setTimeout(typeText, 1000);

document.getElementById("playBtn").addEventListener("click", function () {
  const audio = document.getElementById("myAudio");
  if (audio.paused) {
    audio.play();
    this.textContent = "⏸ 暂停音乐";
  } else {
    audio.pause();
    this.textContent = "▶ 播放音乐";
  }
});
