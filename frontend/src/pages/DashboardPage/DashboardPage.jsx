import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import { Button } from '../../components/ui/Button/Button';

import './DashboardPage.css';
import { getActivityFeed } from '../../services/activityApi';
import { getAllExercisesStatus, getMe, getMyRating } from '../../services/api';

function getUserFromStorage() {
   try {
      return JSON.parse(localStorage.getItem('user')) || {};
   } catch {
      return {};
   }
}

function formatActivityTime(value) {
   const date = new Date(value);
   return date.toLocaleString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
   });
}

const DIFFICULTY_RU = {
   easy: 'Легкий',
   medium: 'Средний',
   hard: 'Сложный',
   unknown: 'Неизвестно'
};

const DIFFICULTY_ORDER = {
   easy: 1,
   medium: 2,
   hard: 3,
   unknown: 99
};

function DashboardPage() {
   const navigate = useNavigate();
   const [user, setUser] = useState(getUserFromStorage());

   const [activityFeed, setActivityFeed] = useState([]);
   const [loadingFeed, setLoadingFeed] = useState(true);
   const [feedError, setFeedError] = useState(null);

   const [exercises, setExercises] = useState([]);
   const [loadingExercises, setLoadingExercises] = useState(true);
   const [sortBy, setSortBy] = useState('order');
   const [showAll, setShowAll] = useState(false);

   const [rating, setRating] = useState({ rank: 0, totalParticipants: 0 });
   const [loadingRating, setLoadingRating] = useState(true);

   useEffect(() => {
      async function loadUser() {
         try {
            const freshUser = await getMe();
            setUser(freshUser);
            localStorage.setItem('user', JSON.stringify(freshUser));
         } catch (error) {
            console.error('Failed to load user:', error);
         }
      }

      loadUser();
   }, []);

   useEffect(() => {
      async function fetchFeed() {
         setLoadingFeed(true);
         setFeedError(null);

         try {
            const feedData = await getActivityFeed();

            const allActivities = (feedData.feed || []).map(item => {
               if (item.type === 'module') {
                  return {
                     type: 'module',
                     action: 'Завершен модуль',
                     title: item.title,
                     course: item.course_title,
                     time: item.completed_at
                  };
               }

               return {
                  type: 'course',
                  action: 'Завершен курс',
                  title: item.course_title,
                  time: item.completed_at
               };
            });

            setActivityFeed(allActivities);
         } catch (error) {
            setFeedError(error.message);
         } finally {
            setLoadingFeed(false);
         }
      }

      fetchFeed();
   }, []);

   useEffect(() => {
      async function loadExercises() {
         setLoadingExercises(true);

         try {
            const data = await getAllExercisesStatus();
            setExercises(Array.isArray(data) ? data : []);
         } catch (error) {
            console.error('Failed to load exercises:', error);
            setExercises([]);
         } finally {
            setLoadingExercises(false);
         }
      }

      loadExercises();
   }, []);

   useEffect(() => {
      async function loadRating() {
         setLoadingRating(true);

         try {
            const data = await getMyRating();
            setRating({
               rank: Number(data?.rank || 0),
               totalParticipants: Number(data?.totalParticipants || 0)
            });
         } catch (error) {
            console.error('Failed to load rating:', error);
            setRating({ rank: 0, totalParticipants: 0 });
         } finally {
            setLoadingRating(false);
         }
      }

      loadRating();
   }, []);

   const {
      username = '',
      completed_courses = 0,
      level = 0,
      study_hours = 0,
      avatar
   } = user;

   const ratingValue = loadingRating
      ? '...'
      : `${rating.rank || 0}/${rating.totalParticipants || 0}`;

   const totalMinutes = Number(study_hours) || 0;
   const studyHours = Math.floor(totalMinutes / 60);
   const remainingMinutes = totalMinutes % 60;
   const studyTimeValue = studyHours > 0
      ? `${studyHours} ч ${remainingMinutes} мин`
      : `${remainingMinutes} мин`;

   const stats = [
      { label: 'Завершено курсов', value: completed_courses, color: 'violet' },
      { label: 'Текущий уровень', value: level, color: 'emerald' },
      { label: 'Рейтинг', value: ratingValue, color: 'amber' },
      { label: 'Время обучения', value: studyTimeValue, color: 'blue' }
   ];

   const incompleteExercises = useMemo(
      () => exercises.filter(exercise => !exercise.is_completed),
      [exercises]
   );

   const getDifficultyKey = diff => {
      if (!diff) return 'unknown';

      const value = diff.toLowerCase();
      if (value === 'easy' || value === 'beginner') return 'easy';
      if (value === 'medium' || value === 'intermediate') return 'medium';
      if (value === 'hard' || value === 'advanced') return 'hard';

      return 'unknown';
   };

   const sortedExercises = useMemo(() => {
      if (sortBy !== 'difficulty') {
         return incompleteExercises;
      }

      return [...incompleteExercises].sort((a, b) => {
         const first = DIFFICULTY_ORDER[getDifficultyKey(a.difficulty)];
         const second = DIFFICULTY_ORDER[getDifficultyKey(b.difficulty)];
         return first - second;
      });
   }, [incompleteExercises, sortBy]);

   const visibleExercises = showAll ? sortedExercises : sortedExercises.slice(0, 3);

   return (
      <AppLayout>
         <div className="dashboard-content">
            <header className="dashboard-header">
               <div>
                  <h1 className="dashboard-title">Привет, {username}! 👋</h1>
                  <p className="dashboard-subtitle">
                     Дипломный проект Чулкова Романа и Сейткумар Данияра
                  </p>
               </div>

               <div className="header-actions">

                  <div className="user-avatar">
                     <img
                        src={`http://localhost:5000/uploads/avatars/${avatar || 'default-avatar.png'}`}
                        alt="avatar"
                     />
                  </div>
               </div>
            </header>

            <div className="stats-grid">
               {stats.map((stat, index) => (
                  <div key={index} className={`stat-card stat-${stat.color}`}>
                     <div className="stat-content">
                        <div className="stat-value">{stat.value}</div>
                        <div className="stat-label">{stat.label}</div>
                     </div>
                  </div>
               ))}
            </div>

            <section className="courses-section">
               <div className="section-header">
                  <h2>Активные задачи</h2>
                  <div className="section-tools">
                     <div className="sort-control">
                        <span className="sort-label">Сортировать по:</span>
                        <select
                           className="sort-select"
                           value={sortBy}
                           onChange={event => setSortBy(event.target.value)}
                        >
                           <option value="order">Порядку</option>
                           <option value="difficulty">Сложности</option>
                        </select>
                     </div>

                     <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowAll(!showAll)}
                     >
                        {showAll ? 'Свернуть' : 'Показать все'}
                     </Button>
                  </div>
               </div>

               {loadingExercises ? (
                  <div className="section-loading">Загрузка задач...</div>
               ) : incompleteExercises.length === 0 ? (
                  <div className="congrats-message">
                     🎉 Поздравляем! Все задачи выполнены!
                  </div>
               ) : (
                  <div className="table-scroll">
                     <table className="exercises-table">
                        <thead>
                           <tr>
                              <th>Название</th>
                              <th>Категория</th>
                              <th>Сложность</th>
                              <th>Действие</th>
                           </tr>
                        </thead>
                        <tbody>
                           {visibleExercises.map(exercise => (
                              <tr key={exercise.id}>
                                 <td>{exercise.title}</td>
                                 <td>{exercise.vulnerability_title}</td>
                                 <td>
                                    <span className={`difficulty difficulty-${getDifficultyKey(exercise.difficulty)}`}>
                                       {DIFFICULTY_RU[getDifficultyKey(exercise.difficulty)] || exercise.difficulty}
                                    </span>
                                 </td>
                                 <td>
                                    <Button
                                       size="sm"
                                       onClick={() => navigate(`/exercises/${exercise.vulnerability_code}/${exercise.order_index}`)}
                                    >
                                       Начать
                                    </Button>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               )}
            </section>

            <section className="activity-section">
               <h2>Последняя активность</h2>
               <div className="activity-list">
                  {loadingFeed ? (
                     <div className="activity-item activity-placeholder">Загрузка...</div>
                  ) : feedError ? (
                     <div className="activity-item activity-placeholder activity-error">{feedError}</div>
                  ) : activityFeed.length === 0 ? (
                     <div className="activity-item activity-placeholder">Нет активности</div>
                  ) : (
                     activityFeed.map((activity, index) => (
                        <div key={index} className={`activity-item activity-${activity.type}`}>
                           <div className="activity-icon" />
                           <div className="activity-content">
                              <div className="activity-title-row">
                                 <div className="activity-title">
                                    {activity.action}: {activity.title}
                                 </div>
                                 <div className="activity-time">{formatActivityTime(activity.time)}</div>
                              </div>
                              {activity.type === 'module' && activity.course ? (
                                 <span className="activity-subtitle">({activity.course})</span>
                              ) : null}
                           </div>
                        </div>
                     ))
                  )}
               </div>
            </section>
         </div>
      </AppLayout>
   );
}

export default DashboardPage;
