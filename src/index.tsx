import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './app';
import reportWebVitals from './reportWebVitals';

// 'root' DOM 요소가 존재하는지 확인 후 렌더링
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement as HTMLElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  // 오류 메시지를 콘솔에 출력
  console.error("'root' DOM 요소를 찾을 수 없습니다. public/index.html 파일에 <div id=\"root\"></div>가 있는지 확인하세요.");
}

reportWebVitals();