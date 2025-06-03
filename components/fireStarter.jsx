// components/FireStarter.jsx (로그인 기능 추가)
import { useEffect, useState } from 'react';
import { db, auth } from '../lib/firebase/clientApp';
// signInWithEmailAndPassword, createUserWithEmailAndPassword 추가
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

function FireStarter() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // 로그인/회원가입 관련 상태
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); // 로그인/회원가입 에러 메시지

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        setEmail(''); // 로그인 성공 시 입력 필드 초기화
        setPassword('');
        setError(''); // 에러 메시지 초기화
      }
      // 데이터 가져오기는 로그인 상태와 무관하게 실행되도록 유지 (현재 로직)
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        const itemsCollection = collection(db, 'event');
        const itemSnapshot = await getDocs(itemsCollection);
        const itemList = itemSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setItems(itemList);
      } catch (error) {
        console.error("Error fetching items: ", error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log("User logged in successfully");
    } catch (err) {
      console.error("Error logging in:", err.code, err.message); // 에러 코드와 메시지 모두 로깅
      if (err.code === 'auth/invalid-credential') {
        setError('아이디 또는 비밀번호가 틀렸습니다. 다시 확인해주세요.');
      } else if (err.code === 'auth/user-not-found') { // 참고: 이전 버전의 Firebase에서는 이 코드가 사용될 수 있었음
        setError('등록되지 않은 아이디입니다.');
      } else if (err.code === 'auth/wrong-password') { // 참고: 이전 버전의 Firebase에서는 이 코드가 사용될 수 있었음
        setError('비밀번호가 틀렸습니다.');
      } else {
        // 기타 다른 Firebase 오류 또는 네트워크 오류 등
        setError('로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        // setError(err.message); // 좀 더 구체적인 Firebase 오류 메시지를 보여주고 싶다면 이 줄을 사용
      }
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      console.log("User signed up and logged in successfully");
    } catch (err) {
      console.error("Error signing up:", err.code, err.message);
      if (err.code === 'auth/email-already-in-use') {
        setError('이미 사용 중인 이메일입니다.');
      } else if (err.code === 'auth/weak-password') {
        setError('비밀번호는 6자 이상이어야 합니다.');
      } else {
        setError('회원가입 중 오류가 발생했습니다.');
        // setError(err.message);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      console.log("User logged out");
    } catch (error) {
      console.error("Error logging out:", error);
      setError("로그아웃 중 오류가 발생했습니다.");
    }
  };

  // addItem, updateItem, deleteItem 함수는 이전과 동일하게 유지 (생략)
  const addItem = async (eventData) => {
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
        createTm: serverTimestamp(),
        updateTm: serverTimestamp(),
        authorId: auth.currentUser.uid,
        authorEmail: auth.currentUser.email,
      };
      const docRef = await addDoc(eventCollectionRef, newEventData);
      const newItemWithId = { ...newEventData, id: docRef.id, createTm: new Date(), updateTm: new Date() };
      setItems(prevItems => [newItemWithId, ...prevItems]);
    } catch (e) {
      console.error("Error adding document: ", e);
      alert("이벤트 추가 중 오류가 발생했습니다.");
    }
  };

  const updateItem = async (eventId, dataToUpdate) => {
    if (!auth.currentUser) {
      alert("이벤트를 수정하려면 로그인이 필요합니다.");
      return;
    }
    try {
      const eventDocRef = doc(db, 'event', eventId);
      const itemToUpdate = items.find(item => item.id === eventId);
      if (itemToUpdate && itemToUpdate.authorId !== auth.currentUser.uid) {
        alert("자신이 작성한 이벤트만 수정할 수 있습니다.");
        return;
      }
      await updateDoc(eventDocRef, { ...dataToUpdate, updateTm: serverTimestamp() });
      setItems(prevItems =>
        prevItems.map(item =>
          item.id === eventId ? { ...item, ...dataToUpdate, updateTm: new Date() } : item
        )
      );
    } catch (e) {
      console.error("Error updating document: ", e);
      alert("이벤트 수정 중 오류가 발생했습니다.");
    }
  };

  const deleteItem = async (eventId) => {
    if (!auth.currentUser) {
      alert("이벤트를 삭제하려면 로그인이 필요합니다.");
      return;
    }
    try {
      const eventDocRef = doc(db, 'event', eventId);
      const itemToDelete = items.find(item => item.id === eventId);
      if (itemToDelete && itemToDelete.authorId !== auth.currentUser.uid) {
        alert("자신이 작성한 이벤트만 삭제할 수 있습니다.");
        return;
      }
      await deleteDoc(eventDocRef);
      setItems(prevItems => prevItems.filter(item => item.id !== eventId));
    } catch (e) {
      console.error("Error deleting document: ", e);
      alert("이벤트 삭제 중 오류가 발생했습니다.");
    }
  };


  if (loading && !currentUser) { // 데이터 로딩 중이거나 아직 사용자 상태 확인 전
    return <p>Loading...</p>;
  }

  return (
    <div>
      {currentUser ? (
        <div>
          <p>환영합니다, {currentUser.email}!</p>
          <button onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <div>
          <form onSubmit={handleLogin} style={{ marginBottom: '20px', padding: '10px', border: '1px solid #eee' }}>
            <h3>로그인</h3>
            <div>
              <label htmlFor="email">Email: </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="password">Password: </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <button type="submit">Login</button>
            <button type="button" onClick={handleSignUp} style={{ marginLeft: '10px' }}>Sign Up</button>
          </form>
        </div>
      )}

      {/* 이벤트 목록 및 추가 UI (currentUser가 있을 때만 이벤트 추가 UI가 보이도록 수정) */}
      <h2>Events from Firestore:</h2>
      {loading && items.length === 0 ? <p>Loading events...</p> : null}
      {!loading && items.length === 0 ? <p>No events found.</p> : (
        <ul>
          {items.map(item => (
            <li key={item.id} style={{ border: '1px solid #ccc', margin: '10px', padding: '10px' }}>
              <strong>Title:</strong> {item.title}<br />
              <strong>Contents:</strong> {item.contents}<br />
              {/* ... 기타 아이템 정보 ... */}
              <strong>Author:</strong> {item.authorEmail || item.authorId} <br />
              <strong>ID:</strong> {item.id} <br />
              {currentUser && currentUser.uid === item.authorId && (
                <>
                  <button onClick={() => {
                    const newTitle = prompt("새로운 이벤트 제목을 입력하세요:", item.title);
                    const newContents = prompt("새로운 이벤트 내용을 입력하세요:", item.contents);
                    if (newTitle !== null && newContents !== null) {
                      updateItem(item.id, { title: newTitle, contents: newContents });
                    }
                  }}>Update</button>
                  <button onClick={() => {
                    if (window.confirm(`'${item.title}' 이벤트를 정말 삭제하시겠습니까?`)) {
                      deleteItem(item.id);
                    }
                  }}>Delete</button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {currentUser && (
        <div style={{ marginTop: '20px', borderTop: '1px solid black', paddingTop: '10px' }}>
          <h3>Add New Event</h3>
          <form onSubmit={(e) => {
            e.preventDefault();
            const title = e.target.title.value;
            const contents = e.target.contents.value;
            if (title && contents) {
              addItem({ title, contents });
              e.target.reset();
            } else {
              alert("제목과 내용을 모두 입력해주세요.");
            }
          }}>
            <div>
              <label htmlFor="add-title">Title: </label>
              <input type="text" id="add-title" name="title" required />
            </div>
            <div>
              <label htmlFor="add-contents">Contents: </label>
              <textarea id="add-contents" name="contents" required />
            </div>
            <button type="submit">Add Event (as {currentUser.email})</button>
          </form>
        </div>
      )}
    </div>
  );
}

export default FireStarter;