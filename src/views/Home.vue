<template>
  <div class="home-page">
    <section class="hero-section" ref="heroRef">
      <div class="hero-badge">CS:GO 饰品资产管理</div>
      <h1>让库存、盈亏和交易记录以更高级的方式被看见</h1>
      <p class="hero-copy">
        统一管理购入、出售、市价刷新、浮动盈亏和盈亏日历，让交易不只是记账，而是一套可视化的资产面板。
      </p>
      <div class="hero-actions">
        <a-button type="primary" size="large" class="hero-cta" @click="goRegister">立即注册</a-button>
        <a-button size="large" class="hero-secondary" @click="goLogin">进入登录</a-button>
      </div>
      <div class="hero-preview">
        <div class="preview-shell preview-shell-left">
          <div class="preview-title">库存看板</div>
          <div class="preview-metric positive">+¥ 2,486.80</div>
          <div class="preview-sub">浮动盈亏 / 今日涨跌</div>
        </div>
        <div class="preview-shell preview-shell-right">
          <div class="preview-title">交易效率</div>
          <div class="preview-metric">128 件</div>
          <div class="preview-sub">库存总量与可售状态</div>
        </div>
      </div>
    </section>

    <section class="feature-section">
      <div class="section-head">
        <p>核心能力</p>
        <h2>围绕库存、价格、日历和交易四条主线展开</h2>
      </div>
      <div class="feature-grid">
        <article v-for="card in featureCards" :key="card.title" class="feature-card">
          <component :is="card.icon" class="feature-icon" />
          <h3>{{ card.title }}</h3>
          <p>{{ card.desc }}</p>
        </article>
      </div>
    </section>

    <section class="showcase-section">
      <div class="section-head">
        <p>产品预览</p>
        <h2>首页下滑可以直接看到关键工作台</h2>
      </div>
      <div class="showcase-grid">
        <div class="showcase-panel">
          <div class="panel-label">库存浮盈</div>
          <div class="panel-value positive">+¥ 2,486.80</div>
          <div class="panel-foot">涨跌百分比、持仓估值、刷新时间</div>
        </div>
        <div class="showcase-panel">
          <div class="panel-label">盈亏日历</div>
          <div class="calendar-mock">
            <span v-for="item in calendarMock" :key="item" :class="['calendar-dot', item]"></span>
          </div>
          <div class="panel-foot">红涨绿亏，日历点击可进交易记录</div>
        </div>
        <div class="showcase-panel">
          <div class="panel-label">交易追踪</div>
          <div class="panel-list">
            <span>购入</span>
            <span>卖出</span>
            <span>批量出售</span>
          </div>
          <div class="panel-foot">适合长期追踪和复盘</div>
        </div>
      </div>
    </section>

    <button
      type="button"
      class="floating-register"
      :class="{ visible: showFloatingCta }"
      @click="goRegister"
    >
      立即注册
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { DatabaseOutlined, CalendarOutlined, FundOutlined, ShoppingOutlined } from '@ant-design/icons-vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const router = useRouter()
const heroRef = ref<HTMLElement | null>(null)
const showFloatingCta = ref(false)
const featureCards = [
  {
    title: '库存管理',
    desc: '快速查看持仓、价格、绑定目录与出售入口。',
    icon: DatabaseOutlined
  },
  {
    title: '盈亏日历',
    desc: '按日查看卖出盈亏与库存浮盈，红涨绿亏一眼分辨。',
    icon: CalendarOutlined
  },
  {
    title: '交易分析',
    desc: '围绕购入、卖出、利润与类型分布组织关键指标。',
    icon: FundOutlined
  },
  {
    title: '批量操作',
    desc: '支持批量购入、批量卖出与快速筛选，适合高频管理。',
    icon: ShoppingOutlined
  }
]

const calendarMock = ['positive', 'positive', 'neutral', 'negative', 'negative', 'positive', 'neutral', 'positive']

const goRegister = () => {
  router.push({ path: '/login', query: { tab: 'register' } })
}

const goLogin = () => {
  router.push('/login')
}

let ctx: gsap.Context | null = null

onMounted(() => {
  const root = heroRef.value?.closest('.home-page') as HTMLElement | null
  if (!root) return

  ctx = gsap.context(() => {
    gsap.from('.hero-badge', { y: 18, opacity: 0, duration: 0.7, ease: 'power3.out' })
    gsap.from('h1', { y: 28, opacity: 0, duration: 0.85, delay: 0.08, ease: 'power3.out' })
    gsap.from('.hero-copy', { y: 22, opacity: 0, duration: 0.8, delay: 0.16, ease: 'power3.out' })
    gsap.from('.hero-actions .ant-btn', {
      y: 18,
      opacity: 0,
      duration: 0.7,
      stagger: 0.08,
      delay: 0.22,
      ease: 'power3.out'
    })
    gsap.from('.preview-shell', {
      y: 26,
      opacity: 0,
      duration: 0.9,
      stagger: 0.14,
      delay: 0.3,
      ease: 'power3.out'
    })

    gsap.utils.toArray<HTMLElement>('.feature-card').forEach((card, index) => {
      gsap.fromTo(
        card,
        { y: 36, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          delay: index * 0.06,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 85%'
          }
        }
      )
    })

    gsap.utils.toArray<HTMLElement>('.showcase-panel').forEach((panel, index) => {
      gsap.fromTo(
        panel,
        { y: 42, opacity: 0, scale: 0.98 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.8,
          delay: index * 0.05,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: panel,
            start: 'top 88%'
          }
        }
      )
    })

    ScrollTrigger.create({
      trigger: root,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: self => {
        showFloatingCta.value = self.progress > 0.72
      }
    })
  }, root)
})

onBeforeUnmount(() => {
  ctx?.revert()
})
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at 16% 12%, rgba(34, 211, 238, 0.24), transparent 30%),
    radial-gradient(circle at 82% 18%, rgba(217, 70, 239, 0.2), transparent 28%),
    radial-gradient(circle at 50% 86%, rgba(99, 102, 241, 0.18), transparent 34%),
    linear-gradient(135deg, #030712 0%, #080b1f 46%, #12081f 100%);
  color: #eaf2ff;
}

.hero-section,
.feature-section,
.showcase-section {
  width: min(1180px, calc(100% - 48px));
  margin: 0 auto;
}

.hero-section {
  min-height: 100vh;
  padding: 96px 0 84px;
  color: #fff;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  height: 36px;
  padding: 0 14px;
  border-radius: 8px;
  background: rgba(8, 13, 34, 0.54);
  border: 1px solid rgba(34, 211, 238, 0.28);
  box-shadow: 0 0 28px rgba(34, 211, 238, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(18px);
  font-weight: 600;
  letter-spacing: 0.02em;
}

.hero-section h1 {
  max-width: 760px;
  margin: 22px 0 0;
  font-size: clamp(40px, 7vw, 72px);
  line-height: 1.05;
  font-weight: 800;
}

.hero-copy {
  max-width: 640px;
  margin: 24px 0 0;
  color: rgba(226, 232, 240, 0.76);
  font-size: 18px;
  line-height: 1.8;
}

.hero-actions {
  display: flex;
  gap: 14px;
  margin-top: 32px;
  flex-wrap: wrap;
}

.hero-cta {
  height: 46px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #22d3ee 0%, #8b5cf6 52%, #ec4899 100%);
  box-shadow: 0 16px 34px rgba(34, 211, 238, 0.22), 0 0 28px rgba(236, 72, 153, 0.18);
}

.hero-secondary {
  height: 46px;
  border-radius: 8px;
  border-color: rgba(34, 211, 238, 0.28);
  background: rgba(8, 13, 34, 0.48);
  color: #fff;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.hero-preview {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  margin-top: 56px;
}

.preview-shell {
  min-height: 160px;
  padding: 22px;
  border-radius: 8px;
  background: linear-gradient(145deg, rgba(15, 23, 42, 0.62), rgba(49, 46, 129, 0.24));
  border: 1px solid rgba(34, 211, 238, 0.22);
  backdrop-filter: blur(22px);
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.28), 0 0 40px rgba(34, 211, 238, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.12);
}

.preview-title,
.section-head p,
.panel-label,
.panel-foot {
  font-size: 12px;
  color: rgba(165, 243, 252, 0.68);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.preview-metric {
  margin-top: 18px;
  font-size: 32px;
  font-weight: 800;
}

.preview-metric.positive,
.panel-value.positive {
  color: #22d3ee;
  text-shadow: 0 0 18px rgba(34, 211, 238, 0.34);
}

.preview-sub {
  margin-top: 10px;
  color: rgba(226, 232, 240, 0.68);
}

.feature-section,
.showcase-section {
  padding: 26px 0 84px;
}

.section-head {
  margin-bottom: 22px;
}

.section-head p {
  margin: 0 0 8px;
  color: #22d3ee;
  text-shadow: 0 0 16px rgba(34, 211, 238, 0.2);
}

.section-head h2 {
  margin: 0;
  font-size: 28px;
  line-height: 1.2;
  color: #eaf2ff;
}

.feature-grid,
.showcase-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.feature-card,
.showcase-panel {
  min-height: 190px;
  padding: 22px;
  border-radius: 8px;
  background: linear-gradient(145deg, rgba(15, 23, 42, 0.7), rgba(30, 27, 75, 0.44));
  border: 1px solid rgba(34, 211, 238, 0.18);
  box-shadow: 0 22px 54px rgba(0, 0, 0, 0.28), 0 0 34px rgba(139, 92, 246, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(18px);
}

.feature-icon {
  font-size: 24px;
  color: #22d3ee;
  filter: drop-shadow(0 0 10px rgba(34, 211, 238, 0.26));
}

.feature-card h3 {
  margin: 16px 0 8px;
  font-size: 18px;
  color: #f8fbff;
}

.feature-card p {
  margin: 0;
  color: #aab8d8;
  line-height: 1.7;
}

.showcase-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.showcase-panel {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: linear-gradient(145deg, rgba(15, 23, 42, 0.72), rgba(67, 56, 202, 0.2));
}

.panel-label {
  color: #67e8f9;
}

.panel-value {
  font-size: 32px;
  font-weight: 800;
  color: #f8fbff;
}

.calendar-mock {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin: 18px 0 12px;
}

.calendar-dot {
  display: block;
  height: 18px;
  border-radius: 6px;
  background: rgba(148, 163, 184, 0.22);
}

.calendar-dot.positive { background: #22d3ee; box-shadow: 0 0 12px rgba(34, 211, 238, 0.4); }
.calendar-dot.negative { background: #ec4899; box-shadow: 0 0 12px rgba(236, 72, 153, 0.34); }
.calendar-dot.neutral { background: rgba(148, 163, 184, 0.28); }

.panel-list {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.panel-list span {
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(34, 211, 238, 0.1);
  color: #a5f3fc;
  border: 1px solid rgba(34, 211, 238, 0.18);
  font-weight: 600;
}

.floating-register {
  position: fixed;
  left: 50%;
  bottom: 22px;
  transform: translate(-50%, 24px);
  opacity: 0;
  pointer-events: none;
  height: 48px;
  padding: 0 24px;
  border: none;
  border-radius: 999px;
  background: linear-gradient(135deg, #22d3ee 0%, #8b5cf6 52%, #ec4899 100%);
  color: #fff;
  font-size: 15px;
  font-weight: 800;
  box-shadow: 0 18px 36px rgba(34, 211, 238, 0.26), 0 0 28px rgba(236, 72, 153, 0.22);
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.floating-register.visible {
  opacity: 1;
  transform: translate(-50%, 0);
  pointer-events: auto;
}

@media (max-width: 1080px) {
  .feature-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .showcase-grid,
  .hero-preview {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .hero-section,
  .feature-section,
  .showcase-section {
    width: min(100% - 28px, 1180px);
  }

  .hero-section {
    padding: 72px 0 58px;
  }

  .hero-section h1 {
    font-size: 34px;
  }

  .hero-copy {
    font-size: 15px;
  }

  .feature-grid {
    grid-template-columns: 1fr;
  }
}
</style>
