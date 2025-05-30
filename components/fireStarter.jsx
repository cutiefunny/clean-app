// components/FireStarter.jsx (일부 수정)
import { useEffect, useState } from 'react';
import { db, auth } from '../lib/firebase/clientApp'; // auth 객체도 가져옵니다.
import { onAuthStateChanged } from 'firebase/auth'; // 사용자 상태 변경 감지용
import { collection, getDocs, addDoc } from 'firebase/firestore';

function FireStarter() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null); // 로그인 상태 관리는 유지

  // 사용자 인증 상태 변경 감지 (UI 업데이트용)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      // 이제 여기서 fetchItems를 직접 호출하지 않습니다.
    });
    return () => unsubscribe();
  }, []);

  // 데이터 가져오기 (컴포넌트 마운트 시 실행, 로그인 상태와 무관)
  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        console.log("Fetching items from 'event' collection (publicly)...");
        const itemsCollection = collection(db, 'event');
        const itemSnapshot = await getDocs(itemsCollection);
        const itemList = itemSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setItems(itemList);
      } catch (error) {
        console.error("Error fetching items: ", error); // 권한 오류 발생 시 규칙 재확인
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchItems(); // 컴포넌트 마운트 시 바로 호출
  }, []); // 빈 의존성 배열: 마운트 시 1회 실행

  // addItem 함수는 로그인한 사용자만 가능하도록 유지하거나,
  // 별도의 규칙과 로직이 필요합니다 (현재는 로그인 여부 체크 없음).
  const addItem = async (eventData) => { // eventData는 { title, contents, img, fileblob } 형태의 객체를 받을 수 있습니다.
  if (!auth.currentUser) {
    alert("이벤트를 추가하려면 로그인이 필요합니다.");
    return;
  }
  try {
    const eventCollectionRef = collection(db, 'event');
    const newEventData = {
      title: eventData.title || "새 이벤트 제목",
      contents: eventData.contents || "새 이벤트 내용",
      img: eventData.img || "temp image path",
      fileblob: eventData.fileblob || "temp fileblob data",
      createTm: serverTimestamp(), // 생성 시간은 서버 타임스탬프 사용
      updateTm: serverTimestamp(), // 업데이트 시간도 생성 시에는 동일하게 서버 타임스탬프 사용
      authorId: auth.currentUser.uid, // 예시: 작성자 ID 기록
      // 필요에 따라 다른 필드 추가
    };
    const docRef = await addDoc(eventCollectionRef, newEventData);
    console.log("New event added with ID: ", docRef.id);
    // 성공 후 UI 업데이트 (예: 목록 다시 불러오기 또는 로컬 상태에 추가)
    // fetchItems(); // 목록 새로고침
  } catch (e) {
    console.error("Error adding document: ", e);
    // 사용자에게 오류 메시지 표시
  }
};

const updateItem = async (eventId, dataToUpdate) => { // dataToUpdate는 { title, contents } 등 업데이트할 필드 객체
  if (!auth.currentUser) {
    alert("이벤트를 수정하려면 로그인이 필요합니다.");
    return;
  }
  try {
    const eventDocRef = doc(db, 'event', eventId); // 'event' 컬렉션의 특정 문서 참조
    await updateDoc(eventDocRef, {
      ...dataToUpdate,
      updateTm: serverTimestamp() // 수정 시간 업데이트
    });
    console.log("Event with ID: ", eventId, " updated successfully.");
    // 성공 후 UI 업데이트
    // fetchItems(); // 목록 새로고침
  } catch (e) {
    console.error("Error updating document: ", e);
  }
};

// 사용 예시 (어떤 이벤트의 ID가 'QAx4voWtTchCr5yH2HoY' 라고 가정)
// <button onClick={() => updateItem("QAx4voWtTchCr5yH2HoY", { title: "수정된 이벤트 제목", contents: "내용도 수정했습니다." })}>Update Event</button>

  const handleLogout = async () => { // 로그아웃 함수 예시
    try {
      await auth.signOut(); // auth.signOut()을 직접 호출할 수 있습니다.
      console.log("User logged out");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };


  if (loading) {
    return <p>Loading events...</p>;
  }

  return (
    <div>
      {currentUser ? (
        <button onClick={handleLogout}>Logout</button>
      ) : (
        /* 여기에 로그인 버튼/링크를 둘 수 있습니다. */
        <div>
        </div>
            )}
            <h2>Events from Firestore:</h2>
            {items.length === 0 && !loading ? <p>No events found.</p> : (
              <ul>
                {items.map(item => (
                <li key={item.id}>
                  <strong>Title:</strong> {item.title}<br />
                  <strong>Contents:</strong> {item.contents}<br />
                  <strong>Image:</strong> {item.img}<br />
                  <strong>File Blob:</strong> {item.fileblob}<br />
                  <strong>Created:</strong> {item.createTm?.seconds ? new Date(item.createTm.seconds * 1000).toLocaleString() : 'N/A'}<br />
                  <strong>Updated:</strong> {item.updateTm?.seconds ? new Date(item.updateTm.seconds * 1000).toLocaleString() : 'N/A'}<br />
                  <strong>ID:</strong> {item.id}
                </li>
                ))}
              </ul>
            )}
            {/* 로그인한 사용자만 아이템 추가 버튼을 보여주는 예시 */}
      {currentUser && (
        <button onClick={() => addItem({ name: "New Public Event", details: "Anyone can see this!" })}>
          Add Event (as {currentUser.email})
        </button>
      )}
    </div>
  );
}

export default FireStarter;