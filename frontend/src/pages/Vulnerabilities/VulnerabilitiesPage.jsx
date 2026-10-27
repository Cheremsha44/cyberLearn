import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database,
  Globe,
  ShieldAlert,
  Terminal,
  Search,
  ChevronRight
} from 'lucide-react';

import AppLayout from '../../components/layout/AppLayout';
import { Input } from '../../components/ui/Input/Input';
import { Button } from '../../components/ui/Button/Button';
import { getVulnerabilities,
  getExercisesByCode,
  getVulnerabilityProgress
} from '../../services/api';

const UI_MAP = {
  sql: {
    category: 'database',
    icon: <Database size={24} />,
    color: 'blue',
    severity: 'critical'
  },
  xss: {
    category: 'web',
    icon: <Globe size={24} />,
    color: 'emerald',
    severity: 'high'
  },
  csrf: {
    category: 'web',
    icon: <ShieldAlert size={24} />,
    color: 'amber',
    severity: 'medium'
  },
  rce: {
    category: 'system',
    icon: <Terminal size={24} />,
    color: 'red',
    severity: 'critical'
  }
};

function VulnerabilitiesPage() {
  const navigate = useNavigate();

  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getVulnerabilities();
        const safeData = Array.isArray(data) ? data : [];
        const token = localStorage.getItem('token');

        const withProgress = await Promise.all(
          safeData.map(async vuln => {
            const ui = UI_MAP[vuln.code] || {};
            const isFrozen = Number(vuln.is_frozen) === 1;

            let modules = 0;
            let completed = 0;
            let progress = 0;

            if (!isFrozen) {
              try {
                const exercises = await getExercisesByCode(vuln.code);
                modules = exercises.length;

                if (token) {
                  const prog = await getVulnerabilityProgress(vuln.code);
                  completed = Number(prog.completed) || 0;

                  if (prog.progress !== undefined && prog.progress !== null) {
                    progress = Number(prog.progress) || 0;
                  } else if (prog.total) {
                    progress = Math.round((completed / prog.total) * 100);
                  } else if (modules > 0) {
                    progress = Math.round((completed / modules) * 100);
                  } else {
                    progress = 0;
                  }
                }
              } catch (e) {
                console.warn(`Прогресс для ${vuln.code} не загружен`);
              }
            }

            return {
              ...vuln,
              is_frozen: isFrozen,
              category: ui.category || 'other',
              icon: ui.icon || null,
              color: ui.color || 'gray',
              severity: ui.severity || 'low',
              modules,
              completed,
              progress
            };
          })
        );

        setVulnerabilities(withProgress);
      } catch (e) {
        console.error('Ошибка загрузки уязвимостей', e);
        setVulnerabilities([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const categories = useMemo(() => {
    return [
      { id: 'all', label: 'Все', count: vulnerabilities.length },
      {
        id: 'web',
        label: 'Web',
        count: vulnerabilities.filter(v => v.category === 'web').length
      },
      {
        id: 'database',
        label: 'База данных',
        count: vulnerabilities.filter(v => v.category === 'database').length
      },
      {
        id: 'system',
        label: 'Система',
        count: vulnerabilities.filter(v => v.category === 'system').length
      }
    ];
  }, [vulnerabilities]);

  const filteredVulnerabilities = useMemo(() => {
    return vulnerabilities.filter(v => {
      if (selectedCategory !== 'all' && v.category !== selectedCategory) {
        return false;
      }

      if (
        search &&
        !v.title.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }

      return true;
    });
  }, [vulnerabilities, selectedCategory, search]);

  if (loading) {
    return (
      <AppLayout>
        <div className="page-loading">Загрузка уязвимостей...</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <header className="vulnerabilities-header">
        <div>
          <h1 className="page-title">Каталог уязвимостей</h1>
          <p className="page-subtitle">
            Дипломной проект Сейткумар Данияр и Чулков Роман
          </p>
        </div>

        <div className="header-actions">
          <Input
            placeholder="Поиск уязвимостей..."
            icon={<Search size={16} />}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </header>

      <div className="categories-filter">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`category-btn ${
              selectedCategory === cat.id ? 'active' : ''
            }`}
          >
            {cat.label}
            <span className="category-count">{cat.count}</span>
          </button>
        ))}
      </div>

      {filteredVulnerabilities.length === 0 && (
        <div className="empty-state">Уязвимости не найдены</div>
      )}

      <div className="vulnerabilities-grid">
        {filteredVulnerabilities.map(vuln => (
          <div
            key={vuln.id}
            className={`vulnerability-card vuln-${vuln.color} ${vuln.is_frozen ? 'vuln-frozen' : ''}`}
          >
            <div className="vuln-header">
              <div className={`vuln-icon vuln-icon-${vuln.color}`}>
                {vuln.icon}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {vuln.is_frozen && (
                  <span className="maintenance-badge">Тех. работы</span>
                )}
                <span className={`severity-badge severity-${vuln.severity}`}>
                  {vuln.severity === 'critical' && 'Критическая'}
                  {vuln.severity === 'high' && 'Высокая'}
                  {vuln.severity === 'medium' && 'Средняя'}
                  {vuln.severity === 'low' && 'Низкая'}
                </span>
              </div>
            </div>

            <h3 className="vuln-title">{vuln.title}</h3>
            <p className="vuln-description">{vuln.description}</p>

            <div className="vuln-progress">
              <div className="progress-info">
                <span>
                  {vuln.completed}/{vuln.modules} модулей
                </span>
                <span>{vuln.progress}%</span>
              </div>

              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${vuln.progress}%` }}
                />
              </div>
            </div>

            <div className="vuln-actions">
              <Button
                size="sm"
                rightIcon={<ChevronRight size={16} />}
                disabled={vuln.is_frozen}
                onClick={() => navigate(`/exercises/${vuln.code}`)}
              >
                {vuln.is_frozen
                  ? 'Тех. работы'
                  : vuln.progress > 0
                    ? 'Продолжить'
                    : 'Начать'}
              </Button>

              <button
                className="learn-more-btn"
                onClick={() => navigate(`/vulnerabilities/${vuln.code}`)}
              >
                Узнать больше
              </button>
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}

export default VulnerabilitiesPage;
