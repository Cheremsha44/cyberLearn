import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import AppLayout from '../../components/layout/AppLayout';
import {
  getExercisesByCode,
  getVulnerabilityByCode,
  getVulnerabilityProgress
} from '../../services/api';
import { Button } from '../../components/ui/Button/Button';

import './ExercisesPage.css';

const DIFFICULTY_LABELS = {
  beginner: 'Начальный',
  easy: 'Легкий',
  intermediate: 'Средний',
  medium: 'Средний',
  advanced: 'Продвинутый',
  hard: 'Сложный'
};

function getDifficultyKey(value) {
  const normalized = String(value || '').toLowerCase();

  if (normalized === 'beginner' || normalized === 'easy') return 'beginner';
  if (normalized === 'intermediate' || normalized === 'medium') return 'intermediate';
  if (normalized === 'advanced' || normalized === 'hard') return 'advanced';

  return 'unknown';
}

function getDifficultyLabel(value) {
  const normalized = String(value || '').toLowerCase();
  return DIFFICULTY_LABELS[normalized] || value || 'Неизвестно';
}

function ExercisesPage() {
  const { code } = useParams();
  const navigate = useNavigate();

  const [vulnerability, setVulnerability] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setLoadError('');

      try {
        const vuln = await getVulnerabilityByCode(code);
        setVulnerability(vuln);

        if (Number(vuln?.is_frozen) === 1) {
          setExercises([]);
          setProgress({ completed: 0, total: 0, percent: 0 });
          return;
        }

        const [loadedExercises, loadedProgress] = await Promise.all([
          getExercisesByCode(code),
          getVulnerabilityProgress(code)
        ]);

        setExercises(Array.isArray(loadedExercises) ? loadedExercises : []);
        setProgress(loadedProgress);
      } catch (error) {
        console.error('Ошибка загрузки упражнений', error);
        setLoadError(error.message || 'Не удалось загрузить упражнения');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [code]);

  const courseFrozen = Number(vulnerability?.is_frozen) === 1;

  const progressPercent = useMemo(() => {
    const raw = Number(progress?.percent || 0);
    return Number.isFinite(raw) ? Math.max(0, Math.min(100, raw)) : 0;
  }, [progress]);

  if (loading) {
    return (
      <AppLayout>
        <div className="page-loading">Загрузка упражнений...</div>
      </AppLayout>
    );
  }

  if (loadError) {
    return (
      <AppLayout>
        <div className="page-empty">{loadError}</div>
      </AppLayout>
    );
  }

  if (!vulnerability) {
    return (
      <AppLayout>
        <div className="page-empty">Уязвимость не найдена</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="exercises-page">
        <header className="exercises-header">
          <span className="exercises-code-badge">{vulnerability.code.toUpperCase()}</span>
          <h1 className="exercises-title">{vulnerability.title}</h1>
          <p className="exercises-description">{vulnerability.description}</p>
        </header>

        {courseFrozen && (
          <div className="course-maintenance-banner">
            Курс временно заморожен. Доступ к упражнениям откроется после завершения техработ.
          </div>
        )}

        {progress && (
          <section className="course-progress-card">
            <div className="course-progress-info">
              <span>Прогресс: {progress.completed} из {progress.total}</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="course-progress-bar">
              <div className="course-progress-fill" style={{ width: `${progressPercent}%` }} />
            </div>
          </section>
        )}

        <section className="exercises-board">
          <div className="exercises-board-head">
            <h2>Модули курса</h2>
            <span>{exercises.length} модулей</span>
          </div>

          <div className="exercises-list">
            {exercises.map(exercise => {
              const moduleFrozen = Number(exercise.is_frozen) === 1;
              const difficultyKey = getDifficultyKey(exercise.difficulty);

              return (
                <article
                  key={exercise.id}
                  className={`exercise-row ${moduleFrozen ? 'is-frozen' : ''}`}
                >
                  <div className="exercise-left">
                    <span className="exercise-order">{exercise.order_index}</span>
                  </div>

                  <div className="exercise-main">
                    <div className="exercise-topline">
                      <h3 className="exercise-row-title">{exercise.title}</h3>
                      {moduleFrozen && <span className="module-state-chip">Заморожен</span>}
                    </div>
                    <p className="exercise-row-description">{exercise.description}</p>
                  </div>

                  <div className="exercise-right">
                    <span className={`difficulty-badge difficulty-${difficultyKey}`}>
                      {getDifficultyLabel(exercise.difficulty)}
                    </span>

                    <Button
                      size="sm"
                      className="exercise-open-btn"
                      disabled={courseFrozen || moduleFrozen}
                      onClick={() => navigate(`/exercises/${code}/${exercise.order_index}`)}
                    >
                      {moduleFrozen ? 'Недоступно' : 'Открыть'}
                    </Button>
                  </div>
                </article>
              );
            })}

            {exercises.length === 0 && (
              <div className="page-empty board-empty">
                {courseFrozen ? 'Курс временно недоступен' : 'Заданий пока нет'}
              </div>
            )}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}

export default ExercisesPage;
