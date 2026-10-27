import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, ChevronRight, CheckCircle2, Github, Twitter, Linkedin, Mail, Database, Globe, ShieldAlert, Terminal, BookOpen, Target, Award } from 'lucide-react';
import { Button } from '../../components/ui/Button/Button';
import './LandingPage.css';
function LandingPage() {
  const navigate = useNavigate();
  
  const scrollToSection = id => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth'
      });
    }
  };
  const categories = [{
    title: 'SQL Injection',
    description: 'Внедрение SQL-кода для обхода аутентификации и кражи данных.',
    count: 12,
    icon: <Database className="category-icon" />,
    color: 'blue'
  }, {
    title: 'XSS (Cross-Site Scripting)',
    description: 'Атаки на клиентов веб-приложений через внедрение скриптов.',
    count: 15,
    icon: <Globe className="category-icon" />,
    color: 'emerald'
  }, {
    title: 'CSRF',
    description: 'Подделка межсайтовых запросов для выполнения действий от имени жертвы.',
    count: 8,
    icon: <ShieldAlert className="category-icon" />,
    color: 'amber'
  }, {
    title: 'RCE (Remote Code Execution)',
    description: 'Удаленное выполнение кода и полный захват сервера.',
    count: 10,
    icon: <Terminal className="category-icon" />,
    color: 'red'
  }];
  return <div className="landing-page">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-container">
          <div className="navbar-logo" onClick={() => navigate('/')}>
            <div className="logo-icon">
              <Shield size={20} />
            </div>
            <span className="logo-text">CyberLearn</span>
          </div>

          <div className="navbar-links">
            <button onClick={() => scrollToSection('features')} className="nav-link">
              О платформе
            </button>
            <button onClick={() => scrollToSection('categories')} className="nav-link">
              Категории
            </button>
            <button onClick={() => scrollToSection('how-it-works')} className="nav-link">
              Обучение
            </button>
          </div>

          <div className="navbar-actions">
            <button onClick={() => navigate('/login')} className="nav-link">
              Войти
            </button>
            <Button onClick={() => navigate('/register')} variant="primary" size="sm">
              Начать обучение
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-bg-gradient"></div>
        <div className="hero-container">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.8
        }} className="hero-content">
            <span className="hero-badge">
              <span className="badge-pulse"></span>
              Платформа нового поколения
            </span>

            <h1 className="hero-title">
              Стань экспертом в <br />
              <span className="hero-title-gradient">Кибербезопасности</span>
            </h1>

            <p className="hero-description">
              Интерактивные курсы, реальные кейсы и практика в безопасной среде.
              Прокачай свои навыки от новичка до профи с помощью передовых технологий.
            </p>

            <div className="hero-actions">
              <Button onClick={() => navigate('/register')} size="lg" rightIcon={<ChevronRight size={20} />}>
                Начать бесплатно
              </Button>
              <Button onClick={() => scrollToSection('how-it-works')} variant="outline" size="lg">
                Как это работает
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 1. Features Section - Почему выбирают CyberLearn */}
      <section id="features" className="features-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">Почему выбирают CyberLearn?</h2>
            <p className="section-description">
              Мы создали экосистему, которая делает обучение эффективным и увлекательным
            </p>
          </div>

          <div className="bento-grid">
            {/* Large Feature */}
            <motion.div className="bento-item bento-large" initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }}>
              <div className="bento-glow"></div>
              <div className="bento-content">
                <h3 className="feature-title-large">Интерактивные лаборатории</h3>
                <p className="feature-description-large">
                  Практикуйтесь в реальных сценариях взлома в безопасной изолированной среде.
                  Виртуальные машины, сетевые симуляторы и CTF-задачи доступны прямо в браузере.
                </p>
                <div className="terminal-preview">
                  <div className="terminal-line">&gt; initializing_environment...</div>
                  <div className="terminal-line">&gt; target_acquired: 192.168.1.45</div>
                  <div className="terminal-line">&gt; starting_attack_vector...</div>
                </div>
              </div>
            </motion.div>

            {/* Medium Features */}
            <motion.div className="bento-item bento-medium" initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            delay: 0.1
          }}>
              <h3 className="feature-title">Сообщество экспертов</h3>
              <p className="feature-description">Общайтесь с профессионалами и менторами.</p>
              <div className="user-avatars">
                {[1, 2, 3, 4, 5].map(i => <div key={i} className="avatar">U{i}</div>)}
                <div className="avatar avatar-count">+2k</div>
              </div>
            </motion.div>

            <motion.div className="bento-item bento-small" initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            delay: 0.2
          }}>
              <h3 className="feature-title">Персонализация</h3>
              <p className="feature-description">Адаптивный путь обучения под ваш уровень.</p>
            </motion.div>

            <motion.div className="bento-item bento-small" initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            delay: 0.3
          }}>
              <h3 className="feature-title">Актуальность</h3>
              <p className="feature-description">Ежемесячные обновления контента.</p>
            </motion.div>

            <motion.div className="bento-item bento-wide" initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            delay: 0.4
          }}>
              <div>
                <h3 className="feature-title">Геймификация</h3>
                <p className="feature-description">XP, достижения, лидерборды и награды за успехи.</p>
              </div>
            </motion.div>

            <motion.div className="bento-item bento-medium" initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            delay: 0.5
          }}>
              <div>
                <h3 className="feature-title">Сертификация</h3>
                <p className="feature-description">Получайте признанные сертификаты после завершения курсов.</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2. Categories Section - Направления обучения (с иконками) */}
      <section id="categories" className="categories-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">Направления обучения</h2>
            <p className="section-description">
              Выберите специализацию и начните глубокое погружение в технологии защиты
            </p>
          </div>

          <div className="categories-grid">
            {categories.map((cat, index) => <motion.div key={index} className={`category-card category-${cat.color}`} initial={{
            opacity: 0,
            y: 30
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            delay: index * 0.1
          }} whileHover={{
            y: -10,
            scale: 1.02
          }}>
                <div className="category-glow"></div>
                <div className="category-icon-wrapper">
                  {cat.icon}
                </div>
                <h3 className="category-title">{cat.title}</h3>
                <p className="category-description">{cat.description}</p>
                <div className="category-footer">
                  <span className="category-count">{cat.count} модулей</span>
                  <div className="category-arrow">
                    <ChevronRight size={16} />
                  </div>
                </div>
              </motion.div>)}
          </div>
        </div>
      </section>

      {/* 3. How It Works Section - Старая версия с иконками */}
      <section id="how-it-works" className="how-it-works-section">
        <div className="section-container-narrow">
          <div className="section-header">
            <h2 className="section-title">Ваш путь к экспертности</h2>
            <p className="section-description">
              Прозрачный процесс обучения, построенный на практике и реальных результатах
            </p>
          </div>

          <div className="timeline">
            {/* Center Line */}
            <div className="timeline-line"></div>

            {[{
            step: '01',
            title: 'Выбор специализации',
            description: 'Определите интересное направление и начните с базовых модулей.',
            icon: <BookOpen size={24} />,
            color: 'violet'
          }, {
            step: '02',
            title: 'Практика в лаборатории',
            description: 'Выполняйте задания в изолированной среде, взламывая реальные уязвимости.',
            icon: <Terminal size={24} />,
            color: 'emerald'
          }, {
            step: '03',
            title: 'Проверка навыков',
            description: 'Проходите CTF-челленджи и получайте мгновенную обратную связь.',
            icon: <Target size={24} />,
            color: 'amber'
          }, {
            step: '04',
            title: 'Сертификация',
            description: 'Подтвердите свои знания и получите сертификат для портфолио.',
            icon: <Award size={24} />,
            color: 'blue'
          }].map((item, i) => <motion.div key={i} initial={{
            opacity: 0,
            y: 50
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true,
            margin: '-100px'
          }} transition={{
            duration: 0.6,
            delay: i * 0.2
          }} className={`timeline-item ${i % 2 === 0 ? 'timeline-item-left' : 'timeline-item-right'}`}>
                {/* Content Side */}
                <div className="timeline-content">
                  <div className={`timeline-card timeline-card-${item.color}`}>
                    <div className="timeline-step-number">{item.step}</div>
                    <h3 className="timeline-title">{item.title}</h3>
                    <p className="timeline-description">{item.description}</p>
                  </div>
                </div>

                {/* Center Icon */}
                <div className="timeline-icon-wrapper">
                  <div className={`timeline-icon timeline-icon-${item.color}`}>
                    <div className="timeline-icon-glow"></div>
                    {item.icon}
                  </div>
                </div>

                {/* Empty Side */}
                <div className="timeline-empty"></div>
              </motion.div>)}
          </div>
        </div>
      </section>

      {/* 4. Important Notice Section - Этика и ответственность */}
      <section id="important-info" className="important-section">
        <div className="section-container">
          <div className="important-grid">
            <div className="important-text">
              <div className="important-badge">
                Важная информация
              </div>
              <h2 className="important-title">
                Этика и ответственность <br />
                <span className="important-title-muted">превыше всего</span>
              </h2>
              <p className="important-description">
                Мы создаем сообщество ответственных специалистов. Знания,
                полученные на платформе, должны использоваться исключительно для
                защиты систем и легального тестирования.
              </p>

              <div className="important-checklist">
                {['Только легальное использование навыков', 'Работа в изолированных средах', 'Соблюдение законодательства'].map((text, i) => <div key={i} className="checklist-item">
                    <CheckCircle2 size={20} className="checklist-icon" />
                    <span>{text}</span>
                  </div>)}
              </div>
            </div>

            <div className="important-cards">
              {[{
              title: 'Образовательные цели',
              desc: 'Платформа создана исключительно для обучения методам защиты.',
              color: 'blue'
            }, {
              title: 'Изолированная среда',
              desc: 'Все атаки проводятся в виртуальных лабораториях, не затрагивая реальную сеть.',
              color: 'emerald'
            }, {
              title: 'Нулевая терпимость',
              desc: 'Любое злонамеренное использование приведет к блокировке аккаунта.',
              color: 'red'
            }].map((card, i) => <motion.div key={i} className={`important-card important-card-${card.color}`} initial={{
              opacity: 0,
              x: 50
            }} whileInView={{
              opacity: 1,
              x: 0
            }} viewport={{
              once: true
            }} transition={{
              delay: i * 0.2
            }} whileHover={{
              scale: 1.05,
              zIndex: 10
            }}>
                  <h3 className="important-card-title">{card.title}</h3>
                  <p className="important-card-desc">{card.desc}</p>
                </motion.div>)}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <motion.div className="cta-card" initial={{
          opacity: 0,
          y: 30
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.6
        }}>
            <div className="cta-content">
              <div className="cta-badge">
                Начните сегодня
              </div>
              <h2 className="cta-title">
                Готовы начать карьеру <br /> в IT-безопасности?
              </h2>
              <p className="cta-description">
                Присоединяйтесь к сообществу из более чем 2000 профессионалов, которые уже прокачивают свои навыки на нашей платформе. Первые 3 модуля доступны бесплатно после регистрации.
              </p>
              <div className="cta-features">
                <div className="cta-feature">
                  <CheckCircle2 size={20} />
                  <span>Бесплатный доступ к базовым курсам</span>
                </div>
                <div className="cta-feature">
                  <CheckCircle2 size={20} />
                  <span>Сертификат после завершения</span>
                </div>
                <div className="cta-feature">
                  <CheckCircle2 size={20} />
                  <span>Поддержка менторов 24/7</span>
                </div>
              </div>
              <div className="cta-actions">
                <Button onClick={() => navigate('/register')} size="lg" className="cta-button-primary" rightIcon={<ChevronRight size={20} />}>
                  Создать аккаунт бесплатно
                </Button>
                <Button variant="outline" size="lg" className="cta-button-secondary">
                  Связаться с нами
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="footer-logo">
                <div className="logo-icon">
                  <Shield size={24} />
                </div>
                <span className="logo-text">CyberLearn</span>
              </div>
              <p className="footer-description">
                Образовательная платформа нового поколения для изучения кибербезопасности.
                Практика, теория и реальные кейсы в одном месте.
              </p>
            </div>

            <div className="footer-links">
              <h3 className="footer-title">Платформа</h3>
              <ul>
                <li><button onClick={() => scrollToSection('features')}>О нас</button></li>
                <li><button onClick={() => scrollToSection('categories')}>Курсы</button></li>
                <li><button onClick={() => navigate('/login')}>Вход</button></li>
              </ul>
            </div>

            <div className="footer-contact">
              <h3 className="footer-title">Контакты</h3>
              <a href="#" className="footer-email">
                <Mail size={20} />
                support@cyberlearn.io
              </a>
              <div className="footer-social">
                <a href="#" className="social-link"><Github size={20} /></a>
                <a href="#" className="social-link"><Twitter size={20} /></a>
                <a href="#" className="social-link"><Linkedin size={20} /></a>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p>Дипломной проект Сейткумар Данияр и Чулков Роман</p>
            <div className="footer-legal">
              <a href="/privacy-policy">Политика конфиденциальности</a>
              <a href="/terms-of-use">Условия использования</a>
            </div>
          </div>
        </div>
      </footer>
    </div>;
}
export default LandingPage;
