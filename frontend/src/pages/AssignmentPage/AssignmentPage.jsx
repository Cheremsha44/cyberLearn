import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Clock, CheckCircle, Upload, Send } from 'lucide-react';
import { Button } from '../../components/ui/Button/Button';
import './AssignmentPage.css';
function AssignmentPage() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [answer, setAnswer] = useState('');
  const assignment = {
    title: 'Практическое задание: Анализ SQL Injection',
    course: 'SQL Injection Advanced',
    deadline: '25 декабря 2024, 23:59',
    points: 100,
    description: 'Проанализируйте предоставленный код и найдите все возможные точки SQL-инъекции. Опишите, как можно эксплуатировать каждую уязвимость и предложите методы защиты.',
    requirements: ['Найти минимум 3 уязвимости', 'Описать эксплуатацию каждой', 'Предложить исправления', 'Приложить скриншоты или код']
  };
  const handleFileChange = e => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };
  const handleSubmit = () => {
    console.log('Submitting assignment:', {
      answer,
      file: selectedFile
    });
    alert('Задание отправлено на проверку!');
  };
  return <div className="assignment-page">
      <aside className="assignment-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon">🛡️</div>
            <span>CyberLearn</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          <button className="nav-item" onClick={() => navigate('/dashboard')}>Дашборд</button>
          <button className="nav-item" onClick={() => navigate('/vulnerabilities')}>Уязвимости</button>
          <button className="nav-item active">Задания</button>
          <button className="nav-item" onClick={() => navigate('/profile')}>Профиль</button>
          <button className="nav-item" onClick={() => navigate('/admin')}>Админ-панель</button>
        </nav>
      </aside>

      <main className="assignment-main">
        <div className="assignment-container">
          <div className="assignment-header">
            <div className="header-content">
              <div className="breadcrumb">
                <span className="breadcrumb-item">{assignment.course}</span>
                <span className="breadcrumb-separator">/</span>
                <span className="breadcrumb-item active">Задание</span>
              </div>
              <h1 className="assignment-title">{assignment.title}</h1>
              <div className="assignment-meta">
                <div className="meta-item">
                  <Clock size={16} />
                  <span>Срок: {assignment.deadline}</span>
                </div>
                <div className="meta-item">
                  <FileText size={16} />
                  <span>{assignment.points} баллов</span>
                </div>
              </div>
            </div>
          </div>

          <div className="assignment-content">
            <div className="assignment-left">
              <div className="description-card">
                <h2>Описание задания</h2>
                <p>{assignment.description}</p>
              </div>

              <div className="requirements-card">
                <h2>Требования</h2>
                <ul className="requirements-list">
                  {assignment.requirements.map((req, i) => <li key={i}>
                      <CheckCircle size={18} />
                      <span>{req}</span>
                    </li>)}
                </ul>
              </div>

              <div className="code-sample-card">
                <h2>Код для анализа</h2>
                <div className="code-block">
                  <pre><code>{`function login(username, password) {
  const query = "SELECT * FROM users WHERE 
    username = '" + username + "' AND 
    password = '" + password + "'";
  
  const result = db.query(query);
  return result.length > 0;
}

function getUser(id) {
  return db.query("SELECT * FROM users WHERE id = " + id);
}

function search(term) {
  return db.query(\`SELECT * FROM posts WHERE title LIKE '%\${term}%'\`);
}`}</code></pre>
                </div>
              </div>
            </div>

            <div className="assignment-right">
              <div className="submission-card">
                <h2>Отправка решения</h2>
                
                <div className="form-group">
                  <label>Ваш ответ</label>
                  <textarea className="answer-textarea" placeholder="Опишите найденные уязвимости и методы защиты..." value={answer} onChange={e => setAnswer(e.target.value)} rows="10" />
                </div>

                <div className="form-group">
                  <label>Прикрепить файлы (опционально)</label>
                  <div className="file-upload">
                    <input type="file" id="file-input" onChange={handleFileChange} className="file-input" />
                    <label htmlFor="file-input" className="file-label">
                      <Upload size={20} />
                      {selectedFile ? selectedFile.name : 'Выберите файл'}
                    </label>
                  </div>
                </div>

                <Button onClick={handleSubmit} size="lg" className="submit-button" leftIcon={<Send size={18} />} disabled={!answer.trim()}>
                  Отправить на проверку
                </Button>
              </div>

              <div className="status-card">
                <h3>Статус</h3>
                <div className="status-item">
                  <div className="status-icon status-pending">
                    <Clock size={18} />
                  </div>
                  <div>
                    <div className="status-label">Не отправлено</div>
                    <div className="status-text">Заполните форму и отправьте решение</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>;
}
export default AssignmentPage;
