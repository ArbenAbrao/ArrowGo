import { motion } from "framer-motion";
import {
  HiOutlineUser,
  HiOutlineShieldCheck,
  HiOutlineLogout,
  HiOutlineMail,
  HiOutlineOfficeBuilding,
  HiOutlineIdentification,
  HiEye,
  HiEyeOff,
} from "react-icons/hi";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

export default function Settings({ darkMode }) {
  const [activeTab, setActiveTab] = useState("account");
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    branch: "",
    role: "",
    id: "",
  });

  const [passwords, setPasswords] = useState({
    current: "",
    next: "",
    confirm: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    next: false,
    confirm: false,
  });

  /* ================= FETCH FULL USER FROM BACKEND ================= */
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser) {
      navigate("/", { replace: true });
      return;
    }

    const fetchUser = async () => {
      try {
        const { data } = await axios.get(`https://tmvasm.arrowgo-logistics.com/api/accounts/${storedUser.id}`);
        setUser(data);
        setProfile({
          firstName: data.first_name,
          lastName: data.last_name,
          email: data.email || "",
          username: data.username || "",
          branch: data.branch || "",
          role: data.role || "",
          id: data.id,
        });
      } catch (err) {
        toast.error("Failed to load account info");
        console.error(err);
      }
    };

    fetchUser();
  }, [navigate]);

  if (!user) return null;

  const isPrivileged = ["Admin", "IT"].includes(user.role);
  const containerBg = darkMode
    ? "bg-gray-800 text-gray-300"
    : "bg-gray-50 text-gray-900";

  /* ================= UPDATE PROFILE ================= */
  const handleProfileSave = async () => {
    try {
      await axios.put(`https://tmvasm.arrowgo-logistics.com/api/accounts/${user.id}`, profile);

      const updatedUser = { ...user, ...profile };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);

      toast.success("Profile updated");
      setIsEditing(false);
    } catch (err) {
      toast.error("Failed to update profile");
      console.error(err);
    }
  };

  /* ================= CHANGE PASSWORD ================= */
  const handleChangePassword = async () => {
    if (passwords.next !== passwords.confirm) {
      toast.error("New password and confirm password do not match");
      return;
    }

    try {
      await axios.put(`https://tmvasm.arrowgo-logistics.com/api/accounts/${user.id}/change-password`, {
        currentPassword: passwords.current,
        newPassword: passwords.next,
      });

      toast.success("Password updated successfully");
      setPasswords({ current: "", next: "", confirm: "" });
      setShowPasswordModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Password update failed");
      console.error(err);
    }
  };

  return (
    <div className={`p-4 sm:p-6 min-h-screen transition-colors duration-300 ${containerBg}`}>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6">

      <div className="flex flex-col items-start mb-4 gap-1 sm:gap-2">
  <div className="flex items-center gap-3">
    <img
      src="/logo4.png"
      alt="Logo"
      className="h-10 w-10 sm:h-12 sm:w-12 object-contain"
    />
    <h1
      className={`text-2xl font-bold ${
        darkMode
          ? "text-cyan-400 drop-shadow-lg"
          : "text-green-500 drop-shadow-lg"
      }`}
    >
      Settings
    </h1>
  </div>
  <p className={darkMode ? "text-gray-300" : "text-gray-500"}>
    Account Informations
  </p>
</div>

        {/* HEADER */}
        <div className={`rounded-xl p-5 mb-6 ${darkMode ? "bg-gray-800 text-white" : "bg-green-50 text-green-900"}`}>
        
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center text-white text-xl font-bold">
              {user.first_name?.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-semibold">{user.first_name} {user.last_name}</h1>
              <p className="text-sm opacity-80">{user.role} • {user.branch}</p>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* LEFT TABS */}
          <div className={`rounded-xl p-4 ${darkMode ? "bg-gray-900" : "bg-white"}`}>
            <button
              onClick={() => setActiveTab("account")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition
                ${activeTab === "account" ? "bg-green-600 text-white" : darkMode ? "hover:bg-gray-800 text-gray-300" : "hover:bg-gray-100 text-gray-700"}`}
            >
              <HiOutlineUser /> Account Info
            </button>

            <button
              onClick={() => setActiveTab("security")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition mt-2
                ${activeTab === "security" ? "bg-green-600 text-white" : darkMode ? "hover:bg-gray-800 text-gray-300" : "hover:bg-gray-100 text-gray-700"}`}
            >
              <HiOutlineShieldCheck /> Security
            </button>
          </div>

          {/* RIGHT PANEL */}
          <div className={`md:col-span-3 rounded-xl p-6 ${darkMode ? "bg-gray-900 text-gray-200" : "bg-white text-gray-800"}`}>
            {activeTab === "account" && (
              <>
                <h2 className="text-lg font-semibold mb-4">Account Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoItem icon={HiOutlineIdentification} label="Full Name" value={isEditing ? <input className="border rounded px-2 py-1 w-full" value={`${profile.firstName} ${profile.lastName}`} disabled /> : `${user.first_name} ${user.last_name}`} />
                  <InfoItem icon={HiOutlineMail} label="Email" value={isEditing ? <input className="border rounded px-2 py-1 w-full" value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} /> : user.email || "—"} />
                  <InfoItem icon={HiOutlineUser} label="Username" value={isEditing ? <input className="border rounded px-2 py-1 w-full" value={profile.username} onChange={e => setProfile({ ...profile, username: e.target.value })} /> : user.username || "—"} />
                  <InfoItem icon={HiOutlineOfficeBuilding} label="Branch" value={user.branch} />
                  <InfoItem icon={HiOutlineShieldCheck} label="Role" value={user.role} />
                  <InfoItem icon={HiOutlineIdentification} label="ID" value={user.id} />
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  {isPrivileged && (!isEditing ? <button onClick={() => setIsEditing(true)} className="px-4 py-2 rounded-lg border text-sm">Edit Profile</button> : <button onClick={handleProfileSave} className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm">Save Changes</button>)}
                  <button onClick={() => setShowPasswordModal(true)} className="px-4 py-2 rounded-lg border text-sm hover:bg-green-600 hover:text-white transition">Change Password</button>
                </div>
              </>
            )}

            {activeTab === "security" && (
              <>
                <h2 className="text-lg font-semibold mb-4">Security Settings</h2>
                <p className="text-sm opacity-80">Login activity, sessions, and security features will be shown here.</p>
                <button onClick={() => { localStorage.clear(); navigate("/", { replace: true }); }} className="mt-4 px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 transition flex items-center gap-2">
                  <HiOutlineLogout /> Logout All Sessions
                </button>
              </>
            )}
          </div>
        </div>

        {/* ================= CHANGE PASSWORD MODAL ================= */}
{showPasswordModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8 relative">
      <h3 className="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100 text-center">
        Change Password
      </h3>

      {/* ================= CURRENT PASSWORD ================= */}
      <div className="relative mb-4">
        <input
          type={showPasswords.current ? "text" : "password"}
          id="currentPassword"
          placeholder=" "
          className="peer w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:text-gray-100"
          value={passwords.current}
          onChange={e => setPasswords({ ...passwords, current: e.target.value })}
        />
        <label
          htmlFor="currentPassword"
          className={`absolute left-4 text-gray-400 text-sm transition-all
            ${passwords.current ? "top-1 text-xs text-green-500" : "top-3 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-sm"}`}
        >
          Current Password
        </label>
        <span
          className="absolute right-4 top-3 cursor-pointer text-gray-500 hover:text-green-500"
          onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
        >
          {showPasswords.current ? <HiEyeOff /> : <HiEye />}
        </span>
      </div>

      {/* ================= NEW PASSWORD ================= */}
      <div className="relative mb-2">
        <input
          type={showPasswords.next ? "text" : "password"}
          id="newPassword"
          placeholder=" "
          className="peer w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:text-gray-100"
          value={passwords.next}
          onChange={e => setPasswords({ ...passwords, next: e.target.value })}
        />
        <label
          htmlFor="newPassword"
          className={`absolute left-4 text-gray-400 text-sm transition-all
            ${passwords.next ? "top-1 text-xs text-green-500" : "top-3 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-sm"}`}
        >
          New Password
        </label>
        <span
          className="absolute right-4 top-3 cursor-pointer text-gray-500 hover:text-green-500"
          onClick={() => setShowPasswords({ ...showPasswords, next: !showPasswords.next })}
        >
          {showPasswords.next ? <HiEyeOff /> : <HiEye />}
        </span>
      </div>

      {/* ================= PASSWORD STRENGTH METER ================= */}
      <div className="h-2 rounded-full w-full bg-gray-200 dark:bg-gray-700 mb-2 overflow-hidden">
        <div
          className={`h-2 transition-all duration-300 ${
            passwords.next.length === 0
              ? "w-0 bg-transparent"
              : passwords.next.length < 8
              ? "w-1/4 bg-red-500"
              : /[A-Z]/.test(passwords.next) &&
                /[a-z]/.test(passwords.next) &&
                /[0-9]/.test(passwords.next) &&
                /[^A-Za-z0-9]/.test(passwords.next)
              ? "w-full bg-green-600"
              : "w-3/4 bg-yellow-400"
          }`}
        ></div>
      </div>

      <ul className="text-xs text-gray-500 dark:text-gray-400 mb-4 pl-4 list-disc">
        <li className={passwords.next.length >= 8 ? "text-green-600" : ""}>Minimum 8 characters</li>
        <li className={/[A-Z]/.test(passwords.next) ? "text-green-600" : ""}>At least 1 uppercase letter</li>
        <li className={/[a-z]/.test(passwords.next) ? "text-green-600" : ""}>At least 1 lowercase letter</li>
        <li className={/[0-9]/.test(passwords.next) ? "text-green-600" : ""}>At least 1 number</li>
        <li className={/[^A-Za-z0-9]/.test(passwords.next) ? "text-green-600" : ""}>At least 1 special character</li>
      </ul>

      {/* ================= CONFIRM PASSWORD ================= */}
      <div className="relative mb-6">
        <input
          type={showPasswords.confirm ? "text" : "password"}
          id="confirmPassword"
          placeholder=" "
          className="peer w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:text-gray-100"
          value={passwords.confirm}
          onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
        />
        <label
          htmlFor="confirmPassword"
          className={`absolute left-4 text-gray-400 text-sm transition-all
            ${passwords.confirm ? "top-1 text-xs text-green-500" : "top-3 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-sm"}`}
        >
          Confirm Password
        </label>
        <span
          className="absolute right-4 top-3 cursor-pointer text-gray-500 hover:text-green-500"
          onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
        >
          {showPasswords.confirm ? <HiEyeOff /> : <HiEye />}
        </span>
      </div>

      {/* ================= BUTTONS ================= */}
      <div className="flex flex-col sm:flex-row justify-end gap-3">
        <button
          onClick={() => setShowPasswordModal(false)}
          className="px-4 py-2 rounded-full border border-gray-300 dark:border-gray-700 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            const { current, next, confirm } = passwords;

            if (next !== confirm) {
              toast.error("New password and confirm password must match");
              return;
            }

            if (current === next) {
              toast.error("New password cannot be the same as current password");
              return;
            }

            if (
              next.length < 8 ||
              !/[A-Z]/.test(next) ||
              !/[a-z]/.test(next) ||
              !/[0-9]/.test(next) ||
              !/[^A-Za-z0-9]/.test(next)
            ) {
              toast.error("Password does not meet strength requirements");
              return;
            }

            handleChangePassword();
            toast.success("Password updated successfully!");
            setPasswords({ current: "", next: "", confirm: "" });
            setShowPasswordModal(false);
          }}
          className="px-4 py-2 rounded-full bg-green-600 text-white text-sm hover:bg-green-700 transition"
        >
          Update
        </button>
      </div>
    </div>
  </div>
)}

      </motion.div>
    </div>
  );
}

/* ================= SMALL INFO CARD ================= */
function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="border rounded-lg p-4 flex items-center gap-3">
      <Icon className="text-green-600 text-xl" />
      <div className="w-full">
        <p className="text-xs opacity-70">{label}</p>
        <div className="font-medium">{value}</div>
      </div>
    </div>
  );
}
