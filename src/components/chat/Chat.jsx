import { useEffect, useRef, useState } from "react";
import "./chat.css";
import EmojiPicker from "emoji-picker-react";
import {
  arrayUnion,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useChatStore } from "../../lib/chatStore";
import { useUserStore } from "../../lib/userStore";
import { format } from "timeago.js";
import RecordRTC from "recordrtc";
import { upload } from "../../lib/upload";
import { AiFillAudio } from "react-icons/ai";

const Chat = () => {
  const [chat, setChat] = useState({});
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [img, setImg] = useState({
    file: null,
    url: "",
  });
  const [isRecording, setIsRecording] = useState(false);
  const [recorder, setRecorder] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);

  const { currentUser } = useUserStore();
  const { chatId, user, isCurrentUserBlocked, isReceiverBlocked } =
    useChatStore();

  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.messages]);

  useEffect(() => {
    if (chatId) {
      const unSub = onSnapshot(doc(db, "chats", chatId), (res) => {
        setChat(res.data() || {});
      });

      return () => {
        unSub();
      };
    }
  }, [chatId]);

  const handleEmoji = (e) => {
    setText((prev) => prev + e.emoji);
    setOpen(false);
  };

  const handleImg = (e) => {
    if (e.target.files[0]) {
      setImg({
        file: e.target.files[0],
        url: URL.createObjectURL(e.target.files[0]),
      });
    }
  };

  const handleMicClick = () => {
    if (isRecording) {
      // Stop recording and send the audio
      recorder.stopRecording(() => {
        const blob = recorder.getBlob();
        setAudioBlob(blob);
        setRecorder(null);
        setIsRecording(false);

        if (blob.size > 0) {
          handleSendAudio(blob);
        }
      });
    } else {
      // Start recording
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          const audioRecorder = new RecordRTC(stream, {
            type: "audio",
            mimeType: "audio/webm",
          });
          audioRecorder.startRecording();
          setRecorder(audioRecorder);
          setIsRecording(true);
        })
        .catch((err) => console.error("Error accessing microphone: ", err));
    }
  };

  const handleSendAudio = async (blob) => {
    const audioUrl = URL.createObjectURL(blob);

    // Upload audio
    const file = new File([blob], "audio.webm", { type: "audio/webm" });
    const uploadedAudioUrl = await upload(file);

    // Prepare and send message with the audio URL
    const newMessage = {
      senderId: currentUser.id,
      audio: uploadedAudioUrl,
      createdAt: new Date(),
    };

    await updateDoc(doc(db, "chats", chatId), {
      messages: arrayUnion(newMessage),
    });

    // Clear the audio blob
    setAudioBlob(null);
  };

  const handleSend = async () => {
    if (!text.trim() && !img.file && !audioBlob) return;

    let imgUrl = null;

    try {
      if (img.file) {
        imgUrl = await upload(img.file);
      }

      const newMessage = {
        senderId: currentUser.id,
        text,
        createdAt: new Date(),
        ...(imgUrl && { img: imgUrl }),
      };

      await updateDoc(doc(db, "chats", chatId), {
        messages: arrayUnion(newMessage),
      });

      const userIDs = [currentUser.id, user.id];

      userIDs.forEach(async (id) => {
        const userChatsRef = doc(db, "userchats", id);
        const userChatsSnapshot = await getDoc(userChatsRef);

        if (userChatsSnapshot.exists()) {
          const userChatsData = userChatsSnapshot.data();

          const chatIndex = userChatsData.chats.findIndex(
            (c) => c.chatId === chatId
          );

          userChatsData.chats[chatIndex].lastMessage =
            text || "Audio message sent" || "Image sent";
          userChatsData.chats[chatIndex].isSeen =
            id === currentUser.id ? true : false;
          userChatsData.chats[chatIndex].updatedAt = Date.now();

          await updateDoc(userChatsRef, {
            chats: userChatsData.chats,
          });
        }
      });
    } catch (err) {
      console.log(err);
    } finally {
      setImg({
        file: null,
        url: "",
      });
      setText("");
      setAudioBlob(null);
    }
  };

  return (
    <div className="chat">
      <div className="top">
        <div className="user">
          <img src={user?.avatar || "./avatar.png"} alt="" />
          <div className="texts">
            <span>{user?.username}</span>
            <p>online</p>
          </div>
        </div>
        <div className="icons">
          <img src="./phone.png" alt="" />
          <img src="./video.png" alt="" />
          <img src="./info.png" alt="" />
        </div>
      </div>
    <div className="center">
    {chat?.messages?.map((message) => (
      <div
        className={
          message.senderId === currentUser?.id
            ? `message own ${message.audio ? "audio" : ""}`
            : `message ${message.audio ? "audio" : ""}`
        }
        key={message.createdAt.toString()}
      >
        <div className="texts">
          {message.img && <img src={message.img} alt="" />}
          {message.text && <p>{message.text}</p>}
          {message.audio && (
            <div className="audio-container">
              <audio controls>
                <source src={message.audio} type="audio/webm" />
                Your browser does not support the audio element.
              </audio>
            </div>
          )}
          <span>{format(message.createdAt.toDate())}</span>
        </div>
      </div>
    ))}

    {img.url && (
      <div className="message own">
        <div className="texts">
          <img src={img.url} alt="" />
        </div>
      </div>
    )}
    {audioBlob && (
      <div className="message own">
        <div className="texts">
          <div className="audio-container">
            <audio controls>
              <source
                src={URL.createObjectURL(audioBlob)}
                type="audio/webm"
              />
              Your browser does not support the audio element.
            </audio>
          </div>
        </div>
      </div>
    )}

    <div ref={endRef}></div>
  </div>
      <div className="bottom">
        <div className="icons">
          <label htmlFor="file">
            <img src="./img.png" alt="" />
          </label>
          <input
            type="file"
            id="file"
            style={{ display: "none" }}
            onChange={handleImg}
          />
          <img src="./camera.png" alt="" />
        </div>
        <input
          type="text"
          placeholder={
            isCurrentUserBlocked || isReceiverBlocked
              ? "You cannot send a message"
              : "Type a message..."
          }
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isCurrentUserBlocked || isReceiverBlocked}
        />
        <div className="emoji">
          <img
            id="wink-emoji"
            src="./wink.png"
            alt=""
            onClick={() => setOpen((prev) => !prev)}
          />
          <div className="picker">
            <EmojiPicker open={open} onEmojiClick={handleEmoji} />
          </div>
        </div>
        <button
          onClick={handleMicClick}
          className="mic-button sendButton"
          style={{ display: "flex ", alignItems: "center", gap: "10px" }}
        >
          {isRecording ? "Stop" : "Record"} <AiFillAudio size={20} />
        </button>
        <button
          onClick={handleSend}
          className="sendButton"
          disabled={
            isCurrentUserBlocked ||
            isReceiverBlocked ||
            (!text.trim() && !audioBlob && !img.file)
          }
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
