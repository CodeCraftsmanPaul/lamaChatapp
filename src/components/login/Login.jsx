import React, { useState } from "react";
import "./login.css";
import { toast } from "react-toastify";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth, db } from "../../lib/firebase"; // Adjust the path as necessary
import { doc, setDoc } from "firebase/firestore";
import upload from "../../lib/upload";

const Login = () => {
  // Avatar upload
  const [avatar, setAvatar] = useState({
    file: null,
    url: "",
  });

  const [loading, setLoading] = useState(false);

  const handleAvatar = (e) => {
    if (e.target.files[0]) {
      setAvatar({
        file: e.target.files[0],
        url: URL.createObjectURL(e.target.files[0]),
      });
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);

    const { username, email, password } = Object.fromEntries(formData);

    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      // console.log("User registered:", res.user);
      const imgUrl = await upload(avatar.file);

      await setDoc(doc(db, "users", res.user.uid), {
        username,
        email,
        avatar: imgUrl,
        id: res.user.uid,
        blocked: [],
      });

      await setDoc(doc(db, "userchats", res.user.uid), {
        chats: [],
      });

      toast.success("Account created you can login now!");
    } catch (err) {
      console.log(err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const { email, password } = Object.fromEntries(formData);

    try {
      await signInWithEmailAndPassword(auth, email, password);

      toast.success(" login Successful !");
    } catch (err) {
      console.log(err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Toggle between login and register
  const [isRegistering, setIsRegistering] = useState(false);

  const handleRegisterClick = (event) => {
    event.preventDefault();
    setIsRegistering(true);
  };

  const handleLoginClick = (event) => {
    event.preventDefault();
    setIsRegistering(false);
  };

  // Checkbox state
  const [keepSignedIn, setKeepSignedIn] = useState(false);

  return (
    <div className="login">
      {!isRegistering ? (
        <div className="item">
          <h1>Welcome back to Luma ChatApp, </h1>
          <p className="txt-review">Please log in to continue</p>
          <form onSubmit={handleLogin}>
            <input type="email" placeholder="Email" name="email" />
            <input type="password" placeholder="Password" name="password" />
            <button type="submit" disabled={loading}>
              {loading ? "Loading" : "Sign In"}
            </button>
          </form>
          <p>
            Forgot your password? <a href="/reset-password">Reset it here</a>
          </p>
          <p>
            Don't have an account?{" "}
            <a href="/register" onClick={handleRegisterClick}>
              Sign up
            </a>
          </p>
        </div>
      ) : (
        <div className="item" id="register">
          <h1>Join Luma ChatApp</h1>
          <p className="txt-review">
            Create an account to start chatting with your friends
          </p>
          <form onSubmit={handleRegister}>
            <label htmlFor="file">
              <img src={avatar.url || "./avatar.png"} alt="" />
              Upload an Image
            </label>
            <input
              type="file"
              id="file"
              style={{ display: "none" }}
              onChange={handleAvatar}
            />
            <input
              type="text"
              autoComplete="off"
              placeholder="Username"
              name="username"
            />
            <input
              type="email"
              placeholder="Email"
              name="email"
              autoComplete="off"
            />
            <input
              type="password"
              placeholder="Password"
              name="password"
              autoComplete="off"
            />
            <button type="submit" disabled={loading}>
              {loading ? "Loading" : "Sign Up"}
            </button>
          </form>
          <p>
            Already have an account?
            <a href="/login" onClick={handleLoginClick}>
              <span> </span>Log in
            </a>
          </p>

          <div className="keep-signed-in">
            <input
              type="checkbox"
              id="keepSignedIn"
              checked={keepSignedIn}
              onChange={() => setKeepSignedIn(!keepSignedIn)}
              style={{ cursor: "pointer" }}
            />
            <label htmlFor="keepSignedIn">Keep me signed in</label>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
