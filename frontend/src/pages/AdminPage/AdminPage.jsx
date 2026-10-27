import { useEffect, useMemo, useState } from 'react';
import {
   Users,
   BookOpen,
   Shield,
   TrendingUp,
   Edit,
   Lock,
   Unlock,
   Search,
   Snowflake,
   RefreshCcw,
   X
} from 'lucide-react';

import AppLayout from '../../components/layout/AppLayout';
import { Button } from '../../components/ui/Button/Button';
import { Input } from '../../components/ui/Input/Input';
import ConfirmModal from '../../components/ui/ConfirmModal/ConfirmModal';
import {
   apiGetAdminStats,
   apiGetContentFreezeOverview,
   apiSetCourseFrozen,
   apiSetExerciseFrozen
} from '../../services/adminApi';
import './AdminPage.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function getToken() {
   return localStorage.getItem('token');
}

async function apiGetAdminUsers() {
   const res = await fetch(`${API_URL}/api/admin/users`, {
      headers: { Authorization: `Bearer ${getToken()}` }
   });
   if (!res.ok) throw new Error(await res.text());
   return res.json();
}

async function apiUpdateUserRole(userId, role) {
   const res = await fetch(`${API_URL}/api/admin/users/${userId}/role`, {
      method: 'PATCH',
      headers: {
         'Content-Type': 'application/json',
         Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify({ role })
   });
   if (!res.ok) throw new Error(await res.text());
}

async function apiSetUserBlocked(userId, is_blocked) {
   const res = await fetch(`${API_URL}/api/admin/users/${userId}/block`, {
      method: 'PATCH',
      headers: {
         'Content-Type': 'application/json',
         Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify({ is_blocked })
   });
   if (!res.ok) throw new Error(await res.text());
}

function normalizeCoursePayload(course) {
   const exercises = Array.isArray(course?.exercises) ? course.exercises : [];
   return {
      id: course.id,
      code: course.code,
      title: course.title,
      description: course.description,
      is_frozen: Number(course.is_frozen) === 1,
      modules_total: Number(course.modules_total || exercises.length),
      modules_frozen: Number(
         course.modules_frozen ||
         exercises.filter(item => Number(item.is_frozen) === 1).length
      ),
      exercises: exercises.map(ex => ({
         ...ex,
         is_frozen: Number(ex.is_frozen) === 1
      }))
   };
}

function AdminPage() {
   const [users, setUsers] = useState([]);
   const [usersLoading, setUsersLoading] = useState(false);
   const [usersError, setUsersError] = useState('');
   const [search, setSearch] = useState('');
   const [stats, setStats] = useState(null);

   const [editUser, setEditUser] = useState(null);
   const [newRole, setNewRole] = useState('user');
   const [savingRole, setSavingRole] = useState(false);

   const [blockingIds, setBlockingIds] = useState(new Set());
   const [confirmUser, setConfirmUser] = useState(null);

   const [courseModalOpen, setCourseModalOpen] = useState(false);
   const [courses, setCourses] = useState([]);
   const [coursesLoading, setCoursesLoading] = useState(false);
   const [coursesError, setCoursesError] = useState('');
   const [selectedCourseId, setSelectedCourseId] = useState(null);
   const [courseToggleLoadingIds, setCourseToggleLoadingIds] = useState(new Set());
   const [exerciseToggleLoadingIds, setExerciseToggleLoadingIds] = useState(new Set());

   async function loadUsers() {
      try {
         setUsersLoading(true);
         setUsersError('');

         const data = await apiGetAdminUsers();
         setUsers(
            (data.users || []).map(u => ({
               id: u.id,
               name: u.username,
               email: u.email,
               role: u.role === 'admin' ? 'admin' : 'user',
               is_blocked: Boolean(u.is_blocked)
            }))
         );
      } catch (e) {
         setUsersError(e.message || 'Ошибка загрузки');
      } finally {
         setUsersLoading(false);
      }
   }

   async function loadStats() {
      try {
         const s = await apiGetAdminStats();
         setStats(s);
      } catch (e) {
         // ignore for now
      }
   }

   async function loadCourseFreezeData(options = {}) {
      const { keepSelection = true } = options;
      try {
         setCoursesLoading(true);
         setCoursesError('');

         const data = await apiGetContentFreezeOverview();
         const list = Array.isArray(data?.courses)
            ? data.courses.map(normalizeCoursePayload)
            : [];

         setCourses(list);
         setSelectedCourseId(prev => {
            if (keepSelection && prev && list.some(course => course.id === prev)) {
               return prev;
            }
            return list[0]?.id || null;
         });
      } catch (e) {
         setCoursesError(e.message || 'Не удалось загрузить курсы');
      } finally {
         setCoursesLoading(false);
      }
   }

   useEffect(() => {
      loadUsers();
      loadStats();
   }, []);

   const usersWithExercises = useMemo(() => {
      if (!stats || !stats.userExerciseCounts) return users;
      return users.map(u => {
         const found = stats.userExerciseCounts.find(x => x.user_id === u.id);
         return { ...u, exercises: found ? found.completed_count : 0 };
      });
   }, [users, stats]);

   const filteredUsers = useMemo(() => {
      const q = search.toLowerCase();
      return usersWithExercises.filter(u =>
         [u.name, u.email, u.role].some(v =>
            (v || '').toLowerCase().includes(q)
         )
      );
   }, [usersWithExercises, search]);

   const selectedCourse = useMemo(
      () => courses.find(course => course.id === selectedCourseId) || null,
      [courses, selectedCourseId]
   );

   async function handleSaveRole() {
      try {
         setSavingRole(true);
         await apiUpdateUserRole(editUser.id, newRole);
         setEditUser(null);
         await loadUsers();
      } finally {
         setSavingRole(false);
      }
   }

   async function confirmBlockUser() {
      const user = confirmUser;
      if (!user) return;

      setBlockingIds(prev => new Set(prev).add(user.id));
      try {
         await apiSetUserBlocked(user.id, !user.is_blocked);
         await loadUsers();
      } finally {
         setBlockingIds(prev => {
            const s = new Set(prev);
            s.delete(user.id);
            return s;
         });
         setConfirmUser(null);
      }
   }

   async function handleToggleCourseFreeze(course) {
      setCourseToggleLoadingIds(prev => new Set(prev).add(course.id));
      try {
         await apiSetCourseFrozen(course.id, !course.is_frozen);
         await loadCourseFreezeData();
      } catch (e) {
         setCoursesError(e.message || 'Не удалось обновить курс');
      } finally {
         setCourseToggleLoadingIds(prev => {
            const s = new Set(prev);
            s.delete(course.id);
            return s;
         });
      }
   }

   async function handleToggleExerciseFreeze(exercise) {
      setExerciseToggleLoadingIds(prev => new Set(prev).add(exercise.id));
      try {
         await apiSetExerciseFrozen(exercise.id, !exercise.is_frozen);
         await loadCourseFreezeData();
      } catch (e) {
         setCoursesError(e.message || 'Не удалось обновить модуль');
      } finally {
         setExerciseToggleLoadingIds(prev => {
            const s = new Set(prev);
            s.delete(exercise.id);
            return s;
         });
      }
   }

   async function openCourseModal() {
      setCourseModalOpen(true);
      await loadCourseFreezeData({ keepSelection: false });
   }

   return (
      <AppLayout>
         <header className="admin-header">
            <div>
               <h1 className="admin-title">Панель администратора</h1>
               <p className="admin-subtitle">Дипломный проект Чулкова Романа и Сейткумар Данияра</p>
            </div>
            <Button
               className="admin-freeze-trigger"
               leftIcon={<Snowflake size={16} />}
               onClick={openCourseModal}
            >
               Управление заморозкой
            </Button>
         </header>

         <div className="stats-grid">
            <div className="stat-card stat-violet">
               <div className="stat-icon"><Users size={24} /></div>
               <div>
                  <div className="stat-value">{users.length}</div>
                  <div className="stat-label">Пользователей</div>
               </div>
            </div>
            <div className="stat-card stat-emerald">
               <div className="stat-icon"><BookOpen size={24} /></div>
               <div>
                  <div className="stat-value">
                     {stats && typeof stats.courses_total === 'number' ? stats.courses_total : '—'}
                  </div>
                  <div className="stat-label">Курсов</div>
               </div>
            </div>
            <div className="stat-card stat-amber">
               <div className="stat-icon"><Shield size={24} /></div>
               <div>
                  <div className="stat-value">{stats ? stats.exercises_total : '—'}</div>
                  <div className="stat-label">Упражнений</div>
               </div>
            </div>
            <div className="stat-card stat-blue">
               <div className="stat-icon"><TrendingUp size={24} /></div>
               <div>
                  <div className="stat-value">{stats ? stats.completed_total : '—'}</div>
                  <div className="stat-label">Завершений</div>
               </div>
            </div>
         </div>

         <div className="admin-content">
            <div className="content-header">
               <Input
                  placeholder="Поиск пользователя..."
                  icon={<Search size={16} />}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
               />
               <Button variant="outline" onClick={loadUsers}>
                  Обновить
               </Button>
            </div>

            {usersLoading && <div>Загрузка...</div>}
            {usersError && <div style={{ color: 'crimson' }}>{usersError}</div>}

            {!usersLoading && !usersError && (
               <table className="data-table">
                  <thead>
                     <tr>
                        <th>Имя</th>
                        <th>Email</th>
                        <th className="role-col">Роль</th>
                        <th className="exercises-col">Упражнения</th>
                        <th className="actions-col">Действия</th>
                     </tr>
                  </thead>
                  <tbody>
                     {filteredUsers.map(u => (
                        <tr key={u.id}>
                           <td>{u.name}</td>
                           <td>{u.email}</td>
                           <td className="role-col">
                              <span className={`role-badge role-${u.role}`}>
                                 {u.role}
                              </span>
                           </td>
                           <td className="exercises-col">{u.exercises}</td>
                           <td className="actions-col">
                              <div className="action-buttons">
                                 <button
                                    className="action-btn"
                                    title="Изменить роль"
                                    onClick={() => {
                                       setEditUser(u);
                                       setNewRole(u.role);
                                    }}
                                 >
                                    <Edit size={16} />
                                 </button>

                                 <button
                                    className={`action-btn ${u.is_blocked ? 'success' : 'danger'}`}
                                    title={u.is_blocked ? 'Разблокировать' : 'Заблокировать'}
                                    onClick={() => setConfirmUser(u)}
                                    disabled={blockingIds.has(u.id)}
                                 >
                                    {blockingIds.has(u.id)
                                       ? '...'
                                       : u.is_blocked
                                          ? <Unlock size={16} />
                                          : <Lock size={16} />}
                                 </button>
                              </div>
                           </td>
                        </tr>
                     ))}

                     {filteredUsers.length === 0 && (
                        <tr>
                           <td colSpan={5} style={{ padding: 16 }}>
                              Ничего не найдено
                           </td>
                        </tr>
                     )}
                  </tbody>
               </table>
            )}
         </div>

         {editUser && (
            <div className="modal-overlay" onClick={() => setEditUser(null)}>
               <div className="modal" onClick={e => e.stopPropagation()}>
                  <h2 className="modal-title">Изменить роль</h2>

                  <select
                     className="modal-select"
                     value={newRole}
                     onChange={e => setNewRole(e.target.value)}
                  >
                     <option value="user">user</option>
                     <option value="admin">admin</option>
                  </select>

                  {newRole === 'admin' && (
                     <p style={{ color: '#fbbf24', fontSize: 13, marginTop: 8 }}>
                        Администратор имеет полный доступ к системе
                     </p>
                  )}

                  <div className="modal-actions">
                     <button className="btn-cancel" onClick={() => setEditUser(null)}>
                        Отмена
                     </button>
                     <button
                        className="btn-save"
                        onClick={handleSaveRole}
                        disabled={savingRole}
                     >
                        {savingRole ? 'Сохранение...' : 'Сохранить'}
                     </button>
                  </div>
               </div>
            </div>
         )}

         {courseModalOpen && (
            <div
               className="modal-overlay"
               onClick={() => setCourseModalOpen(false)}
            >
               <div
                  className="modal course-freeze-modal"
                  onClick={e => e.stopPropagation()}
               >
                  <div className="course-freeze-header">
                     <div>
                        <h2 className="modal-title">Управление доступом к курсам</h2>
                        <p className="course-freeze-subtitle">
                           Замораживайте курс целиком или отдельные упражнения на время техработ.
                        </p>
                     </div>
                     <div className="course-freeze-header-actions">
                        <button
                           className="action-btn"
                           title="Обновить список"
                           onClick={() => loadCourseFreezeData()}
                           disabled={coursesLoading}
                        >
                           <RefreshCcw size={16} />
                        </button>
                        <button
                           className="action-btn"
                           title="Закрыть"
                           onClick={() => setCourseModalOpen(false)}
                        >
                           <X size={16} />
                        </button>
                     </div>
                  </div>

                  {coursesError && (
                     <div className="course-freeze-error">{coursesError}</div>
                  )}

                  <div className="course-freeze-layout">
                     <aside className="course-freeze-list">
                        {coursesLoading && (
                           <div className="course-freeze-empty">Загрузка курсов...</div>
                        )}

                        {!coursesLoading && courses.length === 0 && (
                           <div className="course-freeze-empty">Курсы не найдены</div>
                        )}

                        {!coursesLoading && courses.map(course => (
                           <div
                              key={course.id}
                              className={`course-item ${selectedCourseId === course.id ? 'active' : ''}`}
                              onClick={() => setSelectedCourseId(course.id)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={e => {
                                 if (e.key === 'Enter') setSelectedCourseId(course.id);
                              }}
                           >
                              <div className="course-item-top">
                                 <span className="course-item-title">{course.title}</span>
                                 <span className={`freeze-chip ${course.is_frozen ? 'frozen' : 'active'}`}>
                                    {course.is_frozen ? 'Заморожен' : 'Активен'}
                                 </span>
                              </div>
                              <div className="course-item-meta">
                                 {course.code?.toUpperCase()} · {course.modules_total} модулей
                              </div>
                              <div className="course-item-actions">
                                 <button
                                    className={`mini-freeze-btn ${course.is_frozen ? 'unfreeze' : 'freeze'}`}
                                    onClick={e => {
                                       e.stopPropagation();
                                       handleToggleCourseFreeze(course);
                                    }}
                                    disabled={courseToggleLoadingIds.has(course.id)}
                                 >
                                    <Snowflake size={14} />
                                    {courseToggleLoadingIds.has(course.id)
                                       ? '...'
                                       : course.is_frozen
                                          ? 'Разморозить'
                                          : 'Заморозить'}
                                 </button>
                              </div>
                           </div>
                        ))}
                     </aside>

                     <section className="course-freeze-details">
                        {!selectedCourse ? (
                           <div className="course-freeze-empty">
                              Выберите курс слева
                           </div>
                        ) : (
                           <>
                              <div className="course-details-head">
                                 <div>
                                    <h3>{selectedCourse.title}</h3>
                                    <p>{selectedCourse.description}</p>
                                 </div>
                                 <button
                                    className={`mini-freeze-btn ${selectedCourse.is_frozen ? 'unfreeze' : 'freeze'}`}
                                    onClick={() => handleToggleCourseFreeze(selectedCourse)}
                                    disabled={courseToggleLoadingIds.has(selectedCourse.id)}
                                 >
                                    <Snowflake size={14} />
                                    {courseToggleLoadingIds.has(selectedCourse.id)
                                       ? '...'
                                       : selectedCourse.is_frozen
                                          ? 'Разморозить курс'
                                          : 'Заморозить курс'}
                                 </button>
                              </div>

                              <div className="course-modules-head">
                                 <h4>Упражнения</h4>
                                 <span>
                                    Заморожено {selectedCourse.modules_frozen}/{selectedCourse.modules_total}
                                 </span>
                              </div>

                              <div className="module-list">
                                 {selectedCourse.exercises.length === 0 && (
                                    <div className="course-freeze-empty">Упражнений пока нет</div>
                                 )}

                                 {selectedCourse.exercises.map(exercise => (
                                    <div
                                       key={exercise.id}
                                       className={`module-item ${exercise.is_frozen ? 'frozen' : ''}`}
                                    >
                                       <div className="module-main">
                                          <div className="module-title">
                                             #{exercise.order_index} {exercise.title}
                                          </div>
                                          <div className="module-meta">
                                             Сложность: {exercise.difficulty}
                                          </div>
                                       </div>

                                       <button
                                          className={`mini-freeze-btn ${exercise.is_frozen ? 'unfreeze' : 'freeze'}`}
                                          onClick={() => handleToggleExerciseFreeze(exercise)}
                                          disabled={exerciseToggleLoadingIds.has(exercise.id)}
                                       >
                                          <Snowflake size={14} />
                                          {exerciseToggleLoadingIds.has(exercise.id)
                                             ? '...'
                                             : exercise.is_frozen
                                                ? 'Разморозить'
                                                : 'Заморозить'}
                                       </button>
                                    </div>
                                 ))}
                              </div>
                           </>
                        )}
                     </section>
                  </div>
               </div>
            </div>
         )}

         <ConfirmModal
            open={!!confirmUser}
            danger
            title={
               confirmUser?.is_blocked
                  ? 'Разблокировать пользователя'
                  : 'Заблокировать пользователя'
            }
            description={`Вы уверены, что хотите ${confirmUser?.is_blocked ? 'разблокировать' : 'заблокировать'
               } пользователя ${confirmUser?.name}?`}
            confirmText={confirmUser?.is_blocked ? 'Разблокировать' : 'Заблокировать'}
            loading={blockingIds.has(confirmUser?.id)}
            onCancel={() => setConfirmUser(null)}
            onConfirm={confirmBlockUser}
         />
      </AppLayout>
   );
}

export default AdminPage;
