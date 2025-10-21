<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick, onUnmounted } from 'vue';
import FallingEmojis from './FallingEmojis.vue'; // 引入动画组件
import { supabase } from '../supabase'; // 引入 supabase 客户端
import { ElMessage } from 'element-plus';

// 定义成员类型
interface Member {
  id: number;
  name: string;
  avatar: string;
  color: string;
  rearl_name: string;
}

interface Group {
  id: number;
  name: string;
  avatar: string;
  score: number;
  rank: number;
  lastUpdate: string;
  members: Member[];
}

// --- 辅助函数 ---
const getRandomColor = () => {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 80%, 75%)`;
};

// 使用 ref 创建响应式数据
const groups = ref<Group[]>([]);
const isLoading = ref(false);
const sortBy = ref('rank'); // 排序方式：rank, score
const filterValue = ref(''); // 搜索过滤值
const showChart = ref(true); // 是否显示图表
const autoRefresh = ref(false); // 是否自动刷新
const refreshInterval = ref(10); // 自动刷新间隔（秒）
let refreshTimer: number | null = null;

// --- 模拟数据生成（用于演示）---
const generateMockData = (): Group[] => {
  const mockGroups: Group[] = [
    {
      id: 1,
          name: '超级先锋队',
          avatar: 'https://picsum.photos/id/1/200/200',
          score: 1850,
          rank: 1,
          lastUpdate: new Date().toLocaleTimeString(),
      members: [
          { id: 1, name: '张三', avatar: '', color: getRandomColor() },
          { id: 2, name: '李四', avatar: '', color: getRandomColor() },
          { id: 3, name: '王五', avatar: '', color: getRandomColor() }
        ]
    },
    {
      id: 2,
          name: '智慧之星',
          avatar: 'https://picsum.photos/id/2/200/200',
          score: 1720,
          rank: 2,
          lastUpdate: new Date().toLocaleTimeString(),
      members: [
          { id: 4, name: '赵六', avatar: '', color: getRandomColor() },
          { id: 5, name: '钱七', avatar: '', color: getRandomColor() },
          { id: 6, name: '孙八', avatar: '', color: getRandomColor() }
        ]
    },
    {
      id: 3,
          name: '创新梦之队',
          avatar: 'https://picsum.photos/id/3/200/200',
          score: 1650,
          rank: 3,
          lastUpdate: new Date().toLocaleTimeString(),
      members: [
          { id: 7, name: '周九', avatar: '', color: getRandomColor() },
          { id: 8, name: '吴十', avatar: '', color: getRandomColor() },
          { id: 9, name: '郑十一', avatar: '', color: getRandomColor() }
        ]
    },
    {
      id: 4,
          name: '勇敢者联盟',
          avatar: 'https://picsum.photos/id/4/200/200',
          score: 1580,
          rank: 4,
          lastUpdate: new Date().toLocaleTimeString(),
      members: [
          { id: 10, name: '王十二', avatar: '', color: getRandomColor() },
          { id: 11, name: '李十三', avatar: '', color: getRandomColor() },
          { id: 12, name: '张十四', avatar: '', color: getRandomColor() }
        ]
    },
    {
      id: 5,
          name: '奋进小组',
          avatar: 'https://picsum.photos/id/5/200/200',
          score: 1450,
          rank: 5,
          lastUpdate: new Date().toLocaleTimeString(),
      members: [
          { id: 13, name: '刘十五', avatar: '', color: getRandomColor() },
          { id: 14, name: '陈十六', avatar: '', color: getRandomColor() },
          { id: 15, name: '杨十七', avatar: '', color: getRandomColor() }
        ]
    },
    {
      id: 6,
          name: '超越自我',
          avatar: 'https://picsum.photos/id/6/200/200',
          score: 1320,
          rank: 6,
          lastUpdate: new Date().toLocaleTimeString(),
      members: [
          { id: 16, name: '黄十八', avatar: '', color: getRandomColor() },
          { id: 17, name: '周十九', avatar: '', color: getRandomColor() },
          { id: 18, name: '吴二十', avatar: '', color: getRandomColor() }
        ]
    }
  ];
  return mockGroups;
};

// --- 数据获取 ---
const fetchData = async () => {
  isLoading.value = true;
  try {
    // 尝试从supabase获取数据
    // 1. 获取所有小组并按积分降序排序
    const { data: groupsData, error: groupsError } = await supabase
      .from('groups')
      .select('*')
      .order('score', { ascending: false });

    if (groupsError) {
      console.error('Error fetching groups:', groupsError);
      // 如果获取失败，使用模拟数据
      console.log('Using mock data for demo');
      const mockGroups = generateMockData();
      groups.value = mockGroups;
      return;
    }

    // 2. 获取所有学生
    const { data: studentsData, error: studentsError } = await supabase
      .from('students')
      .select('*');

    if (studentsError) {
      console.error('Error fetching students:', studentsError);
      // 如果获取失败，使用模拟数据
      console.log('Using mock data for demo');
      const mockGroups = generateMockData();
      groups.value = mockGroups;
      return;
    }

    // 3. 组合并计算排名
    if (groupsData && studentsData) {
      let rank = 0;
      let lastScore = Infinity;
      const rankedGroups: Group[] = groupsData.map((group, index) => {
        // 如果分数低于上一个，排名等于当前索引+1
        if (group.score < lastScore) {
          rank = index + 1;
        }
        lastScore = group.score;

        const groupMembers = studentsData
          .filter(student => student.listId === group.id)
          .map(student => ({
            id: student.id,
            name: student.name,
            avatar: student.avatar,
            color: getRandomColor(),
            rearl_name: student.rearl_name || student.name,
          }));
        
        return {
          ...group,
          rank: rank, // 赋予计算出的排名
          members: groupMembers,
          lastUpdate: new Date().toLocaleTimeString(),
        };
      });
      groups.value = rankedGroups;
    }
  } catch (error) {
    console.error('Error in fetchData:', error);
    // 使用模拟数据作为后备
    const mockGroups = generateMockData();
    groups.value = mockGroups;
  } finally {
    isLoading.value = false;
  }
};

// --- 自动刷新设置 ---  
watch(autoRefresh, (newVal) => {
  if (newVal) {
    startAutoRefresh();
  } else {
    stopAutoRefresh();
  }
});

const startAutoRefresh = () => {
  stopAutoRefresh();
  refreshTimer = window.setInterval(() => {
    fetchData();
  }, refreshInterval.value * 1000);
};

const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
};

// --- 组件挂载和卸载时的处理 ---
onMounted(() => {
  fetchData();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

const handleResize = () => {
  nextTick(() => {
    renderChart();
  });
};

// --- 对话框状态 ---
const dialogVisible = ref(false);
const selectedGroup = ref<Group | null>(null);
const chartData = ref<{ labels: string[], datasets: any[] }>({ labels: [], datasets: [] });

// --- 计算属性 ---
const filteredGroups = computed(() => {
  let result = [...groups.value];
  
  // 过滤
  if (filterValue.value) {
    const searchTerm = filterValue.value.toLowerCase();
    result = result.filter(group => 
      group.name.toLowerCase().includes(searchTerm)
    );
  }
  
  // 排序
  result.sort((a, b) => {
    switch (sortBy.value) {
      case 'score':
        return b.score - a.score;
      default:
        return a.rank - b.rank;
    }
  });
  
  return result;
});

const topThree = computed(() => filteredGroups.value.slice(0, 3));
const theRest = computed(() => filteredGroups.value.slice(3));

// 计算图表数据
watch(filteredGroups, (newGroups) => {
  nextTick(() => {
    updateChartData(newGroups);
  });
}, { immediate: true });

const updateChartData = (groupsToUse: Group[]) => {
  const labels = groupsToUse.map(group => group.name);
  const scores = groupsToUse.map(group => group.score);
  
  chartData.value = {
    labels,
    datasets: [
      {
        label: '小组积分',
        data: scores,
        backgroundColor: 'rgba(64, 158, 255, 0.5)',
        borderColor: 'rgba(64, 158, 255, 1)',
        borderWidth: 2,
        borderRadius: 6,
        barThickness: 40,
      }
    ]
  };
  
  // 简单的图表渲染
  renderChart();
};

const renderChart = () => {
  // 这里使用简单的Canvas绘制图表
  const canvas = document.getElementById('ranking-chart') as HTMLCanvasElement;
  if (!canvas) return;
  
  // 设置canvas实际尺寸
  const container = canvas.parentElement;
  if (container) {
    canvas.width = container.clientWidth;
  }
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  // 清空画布
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  if (!chartData.value.labels.length) return;
  
  // 简单的柱状图实现
  const padding = 40;
  const chartWidth = canvas.width - padding * 2;
  const chartHeight = canvas.height - padding * 2;
  const barWidth = Math.min(60, chartWidth / chartData.value.labels.length * 0.5);
  const maxValue = Math.max(...chartData.value.datasets[0].data) * 1.1;
  
  // 绘制坐标轴
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, canvas.height - padding);
  ctx.lineTo(canvas.width - padding, canvas.height - padding);
  ctx.stroke();
  
  // 计算柱子间距 - 使用更小的比例来增加间距
  const availableWidth = chartWidth - (padding * 2); // 额外留出左右边距
  const spacing = availableWidth / chartData.value.labels.length;
  
  // 绘制柱状图
  chartData.value.labels.forEach((label, index) => {
    const value = chartData.value.datasets[0].data[index];
    const barHeight = (value / maxValue) * chartHeight;
    const x = padding * 2 + spacing * index + (spacing - barWidth) / 2;
    const y = canvas.height - padding - barHeight;
    
    // 绘制柱子
    ctx.fillStyle = chartData.value.datasets[0].backgroundColor;
    ctx.fillRect(x, y, barWidth, barHeight);
    
    // 绘制边框
    ctx.strokeStyle = chartData.value.datasets[0].borderColor;
    ctx.lineWidth = chartData.value.datasets[0].borderWidth;
    ctx.strokeRect(x, y, barWidth, barHeight);
    
    // 绘制数值
    ctx.fillStyle = '#303133';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(value.toString(), x + barWidth / 2, y - 5);
    
    // 绘制标签（旋转以避免重叠）
    ctx.save();
    ctx.translate(x + barWidth / 2, canvas.height - padding + 20);
    ctx.rotate(-Math.PI / 4);
    ctx.fillText(label, 0, 0);
    ctx.restore();
  });
};

// --- 方法 ---
const showGroupDetails = (group: Group) => {
  selectedGroup.value = group;
  dialogVisible.value = true;
};

const handleCloseDialog = () => {
  dialogVisible.value = false;
};

const getInitials = (name: string) => {
  if (!name) return '';
  return name.length > 2 ? name.slice(-2) : name;
};

const refreshData = () => {
  ElMessage.success('数据已刷新');
  fetchData();
};


</script>

<template>
  <div class="ranking-board">
    <FallingEmojis />
    
    <!-- 顶部控制栏 -->
    <header class="board-header">
      <div class="header-top">
        <h1>小组实时排名系统</h1>
        <div class="header-controls">
          <el-button type="primary" @click="refreshData" :loading="isLoading">
            <el-icon><Refresh /></el-icon> 刷新数据
          </el-button>
          <el-switch v-model="showChart" active-text="显示图表" inactive-text="隐藏图表"/>
        </div>
      </div>
      
      <p class="subtitle">实时追踪各小组表现，激发团队竞争活力</p>
      
      <!-- 搜索和筛选 -->
      <div class="filter-bar">
        <el-input
          v-model="filterValue"
          placeholder="搜索小组名称..."
          prefix-icon="el-icon-search"
          clearable
          class="search-input"
        />
        
        <el-select v-model="sortBy" placeholder="排序方式" class="sort-select">
          <el-option label="按排名" value="rank" />
              <el-option label="按积分" value="score" />
        </el-select>
        
        <el-tooltip content="自动刷新间隔（秒）">
          <div class="auto-refresh">
            <el-switch v-model="autoRefresh" active-text="自动刷新" />
            <el-input-number
              v-if="autoRefresh"
              v-model="refreshInterval"
              :min="5"
              :max="60"
              :step="5"
              size="small"
              class="interval-input"
            />
          </div>
        </el-tooltip>
      </div>
    </header>
    
    <!-- 图表区域 -->
    <el-card v-if="showChart" class="chart-card">
      <template #header>
        <div class="card-header">
          <span>小组积分对比图</span>
          <el-button size="small" type="text" @click="updateChartData(filteredGroups)">
            <el-icon><Refresh /></el-icon> 刷新图表
          </el-button>
        </div>
      </template>
      <div class="chart-container">
        <canvas id="ranking-chart" height="300"></canvas>
      </div>
    </el-card>
    
    <!-- 统计概览 -->
    <div class="stats-overview">
      <el-statistic
         v-for="(stat, index) in [
           { label: '总小组数', value: filteredGroups.length },
           { label: '最高积分', value: filteredGroups.length ? Math.max(...filteredGroups.map(g => g.score)) : 0 },
           { label: '平均积分', value: filteredGroups.length ? Math.round(filteredGroups.reduce((sum, g) => sum + g.score, 0) / filteredGroups.length) : 0 }
         ]"
         :key="index"
         class="stat-item"
         :value="stat.value"
         :precision="0"
         :title="stat.label"
       >
        <template #prefix>
          <el-icon><Promotion /></el-icon>
        </template>
      </el-statistic>
    </div>

    <!-- 前三名展示区 -->
    <section class="top-section">
      <h2 class="section-title">🏆 冠军榜</h2>
      <div class="podium-container">
        <!-- 第二名 -->
        <transition name="podium">
          <div v-if="topThree[1]" class="podium second">
            <div class="podium-platform"></div>
            <el-card class="podium-card second-place" @click="showGroupDetails(topThree[1])">
              <div class="podium-medal">🥈</div>
              <el-avatar :size="80" :src="topThree[1].avatar" class="podium-avatar" />
              <div class="podium-info">
                 <div class="podium-name">{{ topThree[1].name }}</div>
                 <div class="podium-score">{{ topThree[1].score }} 积分</div>
               </div>
            </el-card>
          </div>
        </transition>
        
        <!-- 第一名 -->
        <transition name="podium">
          <div v-if="topThree[0]" class="podium first">
            <div class="podium-platform"></div>
            <el-card class="podium-card first-place" @click="showGroupDetails(topThree[0])">
              <div class="podium-medal">🥇</div>
              <div class="crown">👑</div>
              <el-avatar :size="100" :src="topThree[0].avatar" class="podium-avatar" />
              <div class="podium-info">
                 <div class="podium-name">{{ topThree[0].name }}</div>
                 <div class="podium-score">{{ topThree[0].score }} 积分</div>
               </div>
            </el-card>
          </div>
        </transition>
        
        <!-- 第三名 -->
        <transition name="podium">
          <div v-if="topThree[2]" class="podium third">
            <div class="podium-platform"></div>
            <el-card class="podium-card third-place" @click="showGroupDetails(topThree[2])">
              <div class="podium-medal">🥉</div>
              <el-avatar :size="70" :src="topThree[2].avatar" class="podium-avatar" />
              <div class="podium-info">
                 <div class="podium-name">{{ topThree[2].name }}</div>
                 <div class="podium-score">{{ topThree[2].score }} 积分</div>
               </div>
            </el-card>
          </div>
        </transition>
      </div>
    </section>

    <!-- 其余排名 -->
    <section v-if="theRest.length > 0" class="rest-section">
      <h2 class="section-title">📋 小组排名详情</h2>
      <transition-group name="list" tag="div" class="ranking-list rest-list">
        <el-card 
          v-for="group in theRest" 
          :key="group.id" 
          class="rank-card"
          @click="showGroupDetails(group)"
          shadow="hover"
        >
          <div class="card-content">
            <div class="rank-number">{{ group.rank }}</div>
            <el-avatar :size="60" :src="group.avatar" />
            <div class="group-details">
              <div class="group-name">{{ group.name }}</div>
              <div class="group-stats">
                 <span class="group-score">{{ group.score }} 积分</span>
               </div>
              <div class="group-update" v-if="group.lastUpdate">
                <el-icon><Time /></el-icon> 更新于 {{ group.lastUpdate }}
              </div>
            </div>
            <el-button type="primary" size="small" class="view-btn">
              查看详情
            </el-button>
          </div>
        </el-card>
      </transition-group>
    </section>

    <!-- 空状态 -->
    <el-empty v-if="filteredGroups.length === 0 && !isLoading" description="暂无小组数据" class="empty-state" />

    <!-- 详情对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="selectedGroup ? selectedGroup.name + ' 小组详情' : '小组详情'" 
      width="600px"
      :before-close="handleCloseDialog"
    >
      <div class="dialog-content">
        <div class="dialog-header">
          <el-avatar :size="120" :src="selectedGroup.avatar" class="dialog-avatar" />
          <div class="dialog-header-info">
            <h3 class="dialog-group-name">{{ selectedGroup.name }}</h3>
            <div class="dialog-stats">
              <el-descriptions :column="1" border>
                   <el-descriptions-item label="排名">
                     <span class="rank-badge">{{ selectedGroup.rank }}</span>
                   </el-descriptions-item>
                   <el-descriptions-item label="积分">
                     <span class="score-badge">{{ selectedGroup.score }}</span>
                   </el-descriptions-item>
                   <el-descriptions-item label="最后更新" v-if="selectedGroup.lastUpdate">
                     {{ selectedGroup.lastUpdate }}
                   </el-descriptions-item>
                 </el-descriptions>
            </div>
          </div>
        </div>
        
        <h4 class="dialog-subtitle">团队成员</h4>
        <el-table v-if="selectedGroup.members.length > 0" :data="selectedGroup.members" style="width: 100%">
          <el-table-column label="头像" width="80">
            <template #default="{row}">
              <el-avatar :size="40" :style="{ backgroundColor: row.color }">{{ getInitials(row.name) }}</el-avatar>
            </template>
          </el-table-column>
          <el-table-column prop="name" label="昵称" />
          <el-table-column prop="rearl_name" label="真实名" />

        </el-table>
        <el-empty v-else description="该小组暂无成员信息" />
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.ranking-board {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 30px;
  position: relative;
  min-height: 100vh;
}

/* 顶部控制栏样式 */
.board-header {
  background: linear-gradient(135deg, #adbcff 0%, #ddbbff 100%);
  border-radius: 20px;
  padding: 30px;
  color: white;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.header-top h1 {
  margin: 0;
  font-size: 2.5rem;
  font-weight: 700;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
}

.header-controls {
  display: flex;
  gap: 15px;
  align-items: center;
}

.subtitle {
  margin: 0 0 20px 0;
  font-size: 1.1rem;
  opacity: 0.9;
}

.filter-bar {
  display: flex;
  gap: 15px;
  align-items: center;
  flex-wrap: wrap;
}

.search-input {
  flex: 1;
  min-width: 200px;
}

.sort-select {
  width: 180px;
}

.auto-refresh {
  display: flex;
  align-items: center;
  gap: 10px;
}

.interval-input {
  width: 120px;
}

/* 图表卡片样式 */
.chart-card {
  border-radius: 15px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.chart-card:hover {
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-container {
  position: relative;
  width: 100%;
  height: 300px;
}

/* 统计概览样式 */
.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.stat-item {
  background: white;
  border-radius: 15px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease;
}

.stat-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
}

/* 冠军榜样式 */
.top-section {
  background: white;
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

.section-title {
  font-size: 1.8rem;
  font-weight: 600;
  margin: 0 0 30px 0;
  color: #2c3e50;
  text-align: center;
}

.podium-container {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: 40px;
  min-height: 400px;
  position: relative;
}

.podium {
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.5s ease;
}

.podium-platform {
  border-radius: 10px 10px 0 0;
  z-index: 0;
  position: relative;
  overflow: hidden;
  background-size: 200% 200%;
  animation: gradientMove 8s ease infinite;
}

.podium.first .podium-platform {
    width: 300px;
    height: 200px;
    background: linear-gradient(45deg, rgba(255, 215, 0, 0.5), rgba(255, 179, 0, 0.5), rgba(255, 140, 0, 0.5), rgba(255, 215, 0, 0.5));
    box-shadow: 0 4px 20px rgba(255, 215, 0, 0.3);
  }

.podium.first .podium-platform::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 70%);
  z-index: 1;
}

.podium.second .podium-platform {
    width: 250px;
    height: 150px;
    background: linear-gradient(45deg, rgba(192, 192, 192, 0.5), rgba(160, 160, 160, 0.5), rgba(128, 128, 128, 0.5), rgba(192, 192, 192, 0.5));
    box-shadow: 0 4px 20px rgba(192, 192, 192, 0.3);
  }

.podium.second .podium-platform::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 70%);
  z-index: 1;
}

.podium.third .podium-platform {
    width: 250px;
    height: 100px;
    background: linear-gradient(45deg, rgba(205, 127, 50, 0.5), rgba(184, 110, 44, 0.5), rgba(158, 92, 36, 0.5), rgba(205, 127, 50, 0.5));
    box-shadow: 0 4px 20px rgba(205, 127, 50, 0.3);
  }

.podium.third .podium-platform::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 70%);
  z-index: 1;
}

@keyframes gradientMove {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.podium-card {
  z-index: 1;
  width: 220px;
  border-radius: 15px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: visible !important;
}

.podium-card:hover {
  transform: translateY(-10px) !important;
}

.podium-avatar {
  margin: 20px auto;
  border: 3px solid #fff;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.podium-info {
  padding-bottom: 20px;
}

.podium-name {
  font-size: 1.2rem;
  font-weight: 600;
  color: #303133;
  margin-bottom: 5px;
}

.podium-score {
    font-size: 1.5rem;
    font-weight: 700;
    color: #409eff;
  }

.podium-medal {
  position: absolute;
  top: -15px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 2rem;
  background: white;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.crown {
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 3rem;
  animation: rotateCrown 5s linear infinite;
}

@keyframes rotateCrown {
  0% { transform: translateX(-50%) rotate(0deg); }
  100% { transform: translateX(-50%) rotate(360deg); }
}

.first-place {
  border: 3px solid #FFD700;
  box-shadow: 0 0 30px rgba(255, 215, 0, 0.3);
}

.second-place {
  border: 3px solid #C0C0C0;
  box-shadow: 0 0 20px rgba(192, 192, 192, 0.3);
}

.third-place {
  border: 3px solid #CD7F32;
  box-shadow: 0 0 20px rgba(205, 127, 50, 0.3);
}

/* 其余排名样式 */
.rest-section {
  background: white;
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

.rest-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.rank-card {
  border-radius: 15px;
  transition: all 0.3s ease;
  overflow: hidden;
  cursor: pointer;
  position: relative;
}

.rank-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
}

.card-content {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
}

.rank-number {
  font-size: 2rem;
  font-weight: bold;
  color: #909399;
  width: 50px;
  text-align: center;
}

.group-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.group-name {
  font-size: 1.2rem;
  font-weight: 600;
  color: #303133;
}

.group-stats {
  display: flex;
  align-items: center;
  gap: 15px;
}

.group-score {
  font-size: 1.1rem;
  font-weight: 500;
  color: #409eff;
}

.group-update {
  font-size: 0.8rem;
  color: #909399;
}

.view-btn {
  white-space: nowrap;
}

/* 空状态样式 */
.empty-state {
  margin: 50px 0;
}

/* 对话框样式 */
.dialog-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.dialog-header {
  display: flex;
  gap: 20px;
  align-items: center;
  background: #f5f7fa;
  padding: 20px;
  border-radius: 10px;
}

.dialog-avatar {
  border: 3px solid #fff;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.dialog-header-info {
  flex: 1;
}

.dialog-group-name {
  margin: 0 0 10px 0;
  font-size: 1.5rem;
  color: #303133;
}

.rank-badge {
  font-size: 1.2rem;
  font-weight: bold;
  color: #409eff;
}

.score-badge {
  font-size: 1.2rem;
  font-weight: bold;
  color: #67c23a;
}

.dialog-subtitle {
  margin: 10px 0;
  font-size: 1.2rem;
  color: #303133;
}



/* 过渡动画 */
.list-move {
  transition: transform 0.8s cubic-bezier(0.55, 0, 0.1, 1);
}

.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(30px);
}

.podium-enter-active,
.podium-leave-active {
  transition: all 0.8s cubic-bezier(0.23, 1, 0.32, 1);
}

.podium-enter-from {
  opacity: 0;
  transform: scale(0.8) translateY(50px);
}

.podium-leave-to {
  opacity: 0;
  transform: scale(0.8) translateY(-50px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .ranking-board {
    padding: 10px;
  }
  
  .header-top {
    flex-direction: column;
    gap: 20px;
    text-align: center;
  }
  
  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-input,
  .sort-select {
    width: 100%;
  }
  
  .podium-container {
    flex-direction: column;
    align-items: center;
    gap: 20px;
    min-height: auto;
  }
  
  .podium {
    width: 100%;
    max-width: 300px;
  }
  
  .podium-platform {
    height: 50px !important;
    width: 100% !important;
  }
  
  .rest-list {
    grid-template-columns: 1fr;
  }
  
  .dialog-header {
    flex-direction: column;
    text-align: center;
  }
}
</style>