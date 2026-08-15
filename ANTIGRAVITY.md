# Project Rules & Conventions

## Role & Behavior
- 너는 웹앱 게임 개발자야.

## 규칙
- AI 크레딧을 최소화 할 것.
- 테스트는 내가 할 것이므로 테스트에 크레딧 소모하지 말 것.
- 한글로 소통할 것.

## 개발환경
- 서버 실행
    - npx http-server .

## 환경
Firebase에 frontend와 firestone을 이용하여 배포할 거야

## 목표
스톱워치 게임

5초에 가장 가깝게 누르는 게임

## 기술
- html
- css
- javascript
- Firebase
- Firestore

## 기본 기능
- 화면 중앙에 스톱워치가 표시됨
- 버튼을 누르면 스톱워치가 시작됨
- 버튼을 누르면 스톱워치가 멈춤
- 점수 계산은 다음과 같다.
    - 5초를 넘으면 0점
    - 5초에 가까울수록 높은 점수 획득
    - 1000ms 단위의 오차가 1점
- 점수 상위 10명의 기록을 backend에서 관리하고 보여줌
- 지금 점수가 10위 안에 들면 닉네임과 메시지를 저장할 수 있다.
- 점수와 닉네임과 메시지를 입력하면 top 10 랭킹을 보여준다. 형식은 날짜, 기록, 점수, 닉네임, 메시지 를 보여준다.
- 10위권에 들지 못하면 현재 top 10만 보여준다.
- 재시작 버튼을 클릭하면 처음 화면으로 돌아간다.
- 시간 기록을 분, 초, 밀리초를 보여준다.
- 1등에게는 특별한 효과를 준다.


## firestore 데이터베이스
- 컬렉션 이름: ranking
- 문서: 자동으로 생성됨
- 필드:
  - timestamp: Date (서버 시간)
  - time: Number (밀리초)
  - name: String (닉네임)
  - message: String (메시지)
  - score: Number (점수)
  - rank: Number (순위)

## firestore 데이터 추가 코드
<script type="module">
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyDlz54aYFPFYYWctI6k2bOE-ps7apxRg5U",
    authDomain: "stopwatch-1e0ad.firebaseapp.com",
    projectId: "stopwatch-1e0ad",
    storageBucket: "stopwatch-1e0ad.firebasestorage.app",
    messagingSenderId: "686497195321",
    appId: "1:686497195321:web:a2dbf6a176b6153108b4e8",
    measurementId: "G-T1GGDFBJYM"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);

    async function getMyCollection() {
        const querySnapshot = await getDocs(collection(db, "stopwatch"));
        querySnapshot.forEach((doc) => {
            console.log(doc.id, "=>", doc.data());
        });
    }

</script>