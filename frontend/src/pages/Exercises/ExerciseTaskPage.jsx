import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

import AppLayout from '../../components/layout/AppLayout';
import { getExerciseByOrder } from '../../services/api';
import { Button } from '../../components/ui/Button/Button';

import './ExerciseTaskPage.css';

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

function ExerciseTaskPage() {
   const { code, order } = useParams();

   const [exercise, setExercise] = useState(null);
   const [loading, setLoading] = useState(true);
   const [loadError, setLoadError] = useState('');

   const [startingLab, setStartingLab] = useState(false);
   const [completing, setCompleting] = useState(false);
   const [completed, setCompleted] = useState(false);

   // ==========================================
   // НОВЫЕ СТЕЙТЫ ДЛЯ РАБОТЫ С ФЛАГАМИ
   // ==========================================
   const [showFlagInput, setShowFlagInput] = useState(false);
   const [flagValue, setFlagValue] = useState('');
   const [flagError, setFlagError] = useState('');

   useEffect(() => {
      async function load() {
         setLoading(true);
         setLoadError('');

         try {
            const data = await getExerciseByOrder(code, order);
            setExercise(data);
            setCompleted(Boolean(data.completed));
         } catch (error) {
            console.error('Ошибка загрузки задания', error);
            setLoadError(error.message || 'Задание недоступно');
            setExercise(null);
         } finally {
            setLoading(false);
         }
      }

      load();
   }, [code, order]);

   const handleStartLab = async () => {
      if (!exercise) return;

      setStartingLab(true);
      try {
         const token = localStorage.getItem('token');
         const response = await fetch('http://localhost:5000/api/lab/start-lab', {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
               Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ exerciseId: exercise.id })
         });

         const data = await response.json().catch(() => ({}));

         if (!response.ok) {
            throw new Error(data.message || 'Не удалось запустить лабораторию');
         }

         if (data.status === 'success') {
            window.open(data.url, '_blank');
            return;
         }

         throw new Error(data.message || 'Не удалось запустить лабораторию');
      } catch (error) {
         console.error(error);
         alert(error.message || 'Ошибка сети');
      } finally {
         setStartingLab(false);
      }
   };

   // ==========================================
   // НОВАЯ ФУНКЦИЯ ОТПРАВКИ ФЛАГА (вместо handleCompleteExercise)
   // ==========================================
   const handleFlagSubmit = async () => {
      if (!exercise) return;

      if (!flagValue.trim()) {
         setFlagError('Флаг не может быть пустым');
         return;
      }

      setCompleting(true);
      setFlagError('');

      try {
         const token = localStorage.getItem('token');
         const response = await fetch('http://localhost:5000/api/lab/submit-flag', {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
               Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ exerciseId: exercise.id, flag: flagValue })
         });

         const data = await response.json().catch(() => ({}));

         if (!response.ok) {
            throw new Error(data.message || 'Неверный флаг');
         }

         if (data.status === 'success') {
            setCompleted(true);
            setShowFlagInput(false);
            return;
         }

         throw new Error(data.message || 'Ошибка проверки флага');
      } catch (error) {
         console.error('Ошибка проверки флага:', error);
         setFlagError(error.message || 'Ошибка сети');
      } finally {
         setCompleting(false);
      }
   };

   const difficultyKey = useMemo(() => getDifficultyKey(exercise?.difficulty), [exercise?.difficulty]);

   if (loading) {
      return (
         <AppLayout>
            <div className="page-loading">Загрузка задания...</div>
         </AppLayout>
      );
   }

   if (!exercise) {
      return (
         <AppLayout>
            <div className="page-empty">{loadError || 'Задание не найдено'}</div>
         </AppLayout>
      );
   }

   return (
      <AppLayout>
         <div className="exercise-task-page">
            <header className="exercise-task-header">
               <div className="task-header-meta">
                  <span className="exercise-order-badge">
                     {code.toUpperCase()} · Задание {exercise.order_index}
                  </span>
                  <span className={`task-difficulty-badge difficulty-${difficultyKey}`}>
                     {getDifficultyLabel(exercise.difficulty)}
                  </span>
               </div>

               <h1 className="exercise-task-title">{exercise.title}</h1>
               <p className="exercise-task-description">{exercise.description}</p>
            </header>

            <div className="exercise-task-grid">
               <section className="task-card">
                  <h2>Задание</h2>
                  <p>{exercise.description}</p>
               </section>

               <section className="theory-card">
                  <h2>Теория</h2>
                  <p className="theory-text">
                     {exercise.theory || 'Теория для этого задания пока не добавлена.'}
                  </p>
               </section>
            </div>

            {/* ========================================== */}
            {/* ОБНОВЛЕННЫЙ БЛОК КНОПОК И ВВОДА ФЛАГА */}
            {/* ========================================== */}
            <div className="exercise-task-actions">
               <Button
                  size="md"
                  onClick={handleStartLab}
                  disabled={startingLab}
                  className="task-action-btn"
               >
                  {startingLab ? 'Запуск...' : 'Перейти к практике'}
               </Button>

               {completed ? (
                  <Button
                     size="md"
                     variant="outline"
                     disabled
                     className="task-action-btn complete-btn is-completed"
                  >
                     Задание выполнено 🏆
                  </Button>
               ) : showFlagInput ? (
                  <div className="flag-submission-block" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                     <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                           type="text"
                           placeholder="Формат: flag{...}"
                           value={flagValue}
                           onChange={(e) => {
                              setFlagValue(e.target.value);
                              setFlagError(''); // Сбрасываем ошибку при вводе
                           }}
                           className="flag-input"
                           style={{
                              padding: '8px 12px',
                              borderRadius: '6px',
                              border: '1px solid #ccc',
                              flexGrow: 1,
                              outline: 'none'
                           }}
                        />
                        <Button
                           size="md"
                           onClick={handleFlagSubmit}
                           disabled={completing}
                           className="task-action-btn"
                        >
                           {completing ? 'Проверка...' : 'Сдать'}
                        </Button>
                        <Button
                           size="md"
                           variant="outline"
                           onClick={() => setShowFlagInput(false)}
                           disabled={completing}
                        >
                           Отмена
                        </Button>
                     </div>
                     {flagError && <span style={{ color: '#dc3545', fontSize: '14px', marginTop: '4px' }}>{flagError}</span>}
                  </div>
               ) : (
                  <Button
                     size="md"
                     variant="outline"
                     onClick={() => setShowFlagInput(true)}
                     className="task-action-btn complete-btn"
                  >
                     Я нашел флаг
                  </Button>
               )}
            </div>
            {/* КОНЕЦ ОБНОВЛЕННОГО БЛОКА */}

         </div>
      </AppLayout>
   );
}

export default ExerciseTaskPage;