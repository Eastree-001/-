<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import FallingEmojis from './FallingEmojis.vue'; // 引入动画组件
import { supabase } from '../supabase'; // 引入 supabase 客户端

// 定义数据结构
interface Member {
  id: number;
  name: string;
  avatar: string;
  color: string;
}

interface Group {
  id: number;
  name: string;
  avatar: string;
  score: number;
  rank: number;
  members: Member[];
}

// --- 辅助函数 ---
const getRandomColor = () => {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 80%, 75%)`;
};

// 使用 ref 创建响应式数据
const groups = ref<Group[]>([]);

// --- 数据获取 ---
const fetchData = async () => {
  // 1. 获取所有小组并按积分降序排序
  const { data: groupsData, error: groupsError } = await supabase
    .from('groups')
    .select('*')
    .order('score', { ascending: false });

  if (groupsError) {
    console.error('Error fetching groups:', groupsError);
    return;
  }

  // 2. 获取所有学生
  const { data: studentsData, error: studentsError } = await supabase
    .from('students')
    .select('*');

  if (studentsError) {
    console.error('Error fetching students:', studentsError);
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
        }));
      
      return {
        ...group,
        rank: rank, // 赋予计算出的排名
        members: groupMembers,
      };
    });
    groups.value = rankedGroups;
  }
};

// --- 组件挂载时获取数据 ---
onMounted(() => {
  fetchData();
});


// --- 对话框状态 ---
const dialogVisible = ref(false);
const selectedGroup = ref<Group | null>(null);

// --- 计算属性 ---
const topThree = computed(() => groups.value.slice(0, 3));
const theRest = computed(() => groups.value.slice(3));

// --- 方法 ---
const showGroupDetails = (group: Group) => {
  selectedGroup.value = group;
  dialogVisible.value = true;
};

const getInitials = (name: string) => {
  if (!name) return '';
  return name.length > 2 ? name.slice(-2) : name;
};

</script>

<template>
  <div class="ranking-board">
    <FallingEmojis />
    <header class="board-header">
      <h1>小组实时排名</h1>
    </header>

    <!-- 前三名列表 -->
    <transition-group name="list" tag="div" class="ranking-list top-three">
      <el-card v-for="group in topThree" :key="group.id" class="rank-card"
        @click="showGroupDetails(group)"
        :class="{ 'first-place': group.rank === 1, 'second-place': group.rank === 2, 'third-place': group.rank === 3 }">
        <div class="card-content">
          <div class="rank-number">{{ group.rank }}</div>
          <el-avatar :size="60" :src="group.avatar" />
          <div class="group-details">
            <div class="group-name">{{ group.name }}</div>
            <div class="group-score">{{ group.score }} 积分</div>
          </div>
        </div>
      </el-card>
    </transition-group>

    <!-- 其余排名 -->
    <transition-group name="list" tag="div" class="ranking-list rest-list" v-if="theRest.length > 0">
      <el-card v-for="group in theRest" :key="group.id" class="rank-card"
        @click="showGroupDetails(group)">
        <div class="card-content">
          <div class="rank-number">{{ group.rank }}</div>
          <el-avatar :size="50" :src="group.avatar" />
          <div class="group-details">
            <div class="group-name">{{ group.name }}</div>
            <div class="group-score">{{ group.score }} 积分</div>
          </div>
        </div>
      </el-card>
    </transition-group>

    <!-- 详情对话框 -->
    <el-dialog v-if="selectedGroup" v-model="dialogVisible" :title="selectedGroup.name + ' 小组详情'" width="500px">
      <div class="dialog-content">
        <el-avatar :size="100" :src="selectedGroup.avatar" class="dialog-avatar" />
        <h3>成员列表</h3>
        <el-row :gutter="20" v-if="selectedGroup.members.length > 0">
          <el-col :span="8" v-for="member in selectedGroup.members" :key="member.id" class="member-item">
            <el-avatar :size="50" :style="{ backgroundColor: member.color }">{{ getInitials(member.name) }}</el-avatar>
            <span>{{ member.name }}</span>
          </el-col>
        </el-row>
        <p v-else>该小组暂无成员信息。</p>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.ranking-board {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative; /* 为fixed定位的子元素提供一个容器 */
}

.board-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.board-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.board-header p {
  font-size: 1rem;
  color: #888;
  margin-bottom: 1.5rem;
}

.ranking-list {
  width: 100%;
  gap: 1.5rem;
  display: grid;
}

.top-three {
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  margin-bottom: 2rem;
}

.rest-list {
  grid-template-columns: repeat(3, 1fr);
}

.rank-card {
  border-radius: 12px;
  transition: all 0.5s ease;
  position: relative;
  overflow: hidden;
  background-color: #fff;
  border: 1px solid #e4e7ed;
  cursor: pointer; /* 添加手型光标 */
  z-index: 1; /* 确保卡片在动画层之上 */
}

.rank-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.card-content {
  display: flex;
  align-items: center;
  padding: 1.25rem;
}

.rank-number {
  font-size: 2rem;
  font-weight: bold;
  color: #909399;
  width: 60px;
  text-align: center;
  margin-right: 1rem;
}

.group-details {
  margin-left: 1.5rem;
  display: flex;
  flex-direction: column;
}

.group-name {
  font-size: 1.2rem;
  font-weight: 500;
  color: #303133;
}

.group-score {
  font-size: 0.9rem;
  color: #606266;
  margin-top: 0.25rem;
}


/* 其余列表的小卡片样式 */
.rest-list .card-content {
  padding: 0.75rem;
}

.rest-list .rank-number {
  font-size: 1.5rem;
  width: 45px;
}

.rest-list .group-name {
  font-size: 1rem;
}

.rest-list .group-details {
  margin-left: 1rem;
}


/* --- 特殊名次样式 --- */
.first-place {
  border: 2px solid #FFD700;
  box-shadow: 0 0 25px rgba(255, 215, 0, 0.7);
}
.first-place:hover { transform: translateY(-5px) scale(1.05); }

.first-place .rank-number {
  color: #FFD700;
  font-size: 2.2rem;
}

.first-place::before {
  content: '👑';
  position: absolute;
  top: -10px;
  right: 10px;
  font-size: 2.5rem;
  transform: rotate(15deg);
  opacity: 0.8;
}

.second-place {
  border-color: #C0C0C0;
  box-shadow: 0 0 10px rgba(192, 192, 192, 0.5);
}
.second-place:hover { transform: translateY(-5px) scale(1.02); }

.second-place .rank-number {
  color: #A8A8A8;
}

.third-place {
  border-color: #CD7F32;
}
.third-place:hover { transform: translateY(-5px) scale(1.02); }

.third-place .rank-number {
  color: #CD7F32;
}

/* --- 对话框样式 --- */
.dialog-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.dialog-avatar {
  margin-bottom: 1.5rem;
}

.dialog-content h3 {
  margin: 1rem 0;
}

.member-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 1rem;
}

.member-item span {
  margin-top: 0.5rem;
  font-size: 0.9rem;
}

/* --- 过渡动画 --- */
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
</style>