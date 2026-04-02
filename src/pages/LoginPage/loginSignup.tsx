import React, { useState, useEffect } from "react";
import { Form, Input, Button, Spin, message, Modal } from "antd";
import "./../../components/loginComponent.scss";
import icalLogo from "./../../components/Ical_logo.svg";
import icalIndxxLogo from "./../../components/Ical_Indxx_logo.svg";
import { useNavigate } from "react-router-dom";
import PasswordDetailModal from "../../components/modal/PasswordDetailModal";
import SubmitModal from "../../components/modal/submitModal";
import TextCarousel from "../../components/TextCarousel/TextCarousel";
import { useAuth } from "../../hooks/useAuth";
import { useAuthStore } from "../../stores/authStore";

const LoginSignup: React.FC = () => {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  const [forgotPasswordFlow, setForgotPasswordFlow] = useState(false);
  const [newPasswordOTPFlow, setNewPasswordOTPFlow] = useState(false);
  const [form] = Form.useForm();
  const [formForgotPassword] = Form.useForm();
  const [formForgotConfirmNewPassword] = Form.useForm();
  const [showPasswordDetailModal, setShowPasswordDetailModal] = useState(false);
  const [passwordDetailOkText, setPasswordDetailOkText] =
    useState<string>("OK");
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [localSpinning, setLocalSpinning] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState<string>("");
  const [loginOtpFlow, setLoginOtpFlow] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");

  // ── Door animation: "close" = panels off-screen, "idle" = normal, "open" = panels fly out
  const [doorState, setDoorState] = useState<"close" | "idle" | "open">(
    "close",
  );

  const {
    authError,
    isSpinning,
    setSpinning,
    otp,
    setnewpassword,
    sendLoginOtp,
    verifyLoginOtp,
    logout,
    resetError,
  } = useAuth();
  const { showSessionExpiredModal, sessionExpiredMessage } = useAuthStore();

  const carouselItems = [
  "Hierarchical Sector → Theme → Sub-Theme Engine",
  "Intelligent Company Classification System",
  "Automated Thematic Mapping & Tagging",
  "Scalable Research-Driven Data Architecture",
  "Real-Time Theme & Industry Updates",
  "Advanced Multi-Level Industry Segmentation",
  "Comprehensive Global Company Coverage",
];

  /* ── Entrance: "door closing" – panels slide IN once. Uses cancelled-flag
       to prevent React StrictMode double-invoke from firing animation twice. */
  useEffect(() => {
    let cancelled = false;
    const tid = setTimeout(() => {
      if (!cancelled) setDoorState("idle");
    }, 40);
    return () => {
      cancelled = true;
      clearTimeout(tid);
    };
  }, []);

  /* ── Clear session on mount - Disabled for 'bypass' workflow ── */
  // useEffect(() => {
  //   sessionStorage.clear();
  //   localStorage.clear();
  // }, []);

  /* ── Auth error */
  useEffect(() => {
    if (authError?.error) {
      messageApi.error(authError.error);
      resetError();
    }
  }, [authError, resetError, messageApi]);

  const onFinish = async (formData: any) => {
    const { email } = formData;
    setSpinning(true);
    try {
      await sendLoginOtp(email);
      setLoginEmail(email);
      setLoginOtpFlow(true);
      messageApi.success("OTP sent to your email!");
    } catch (error: any) {
      setErrorMessage(
        error.response?.data?.detail ||
          error.message ||
          "Failed to send OTP",
      );
      setShowErrorModal(true);
    } finally {
      setSpinning(false);
    }
  };

  const onVerifyLoginOtp = async (formData: any) => {
    const { otp } = formData;
    setSpinning(true);
    try {
      await verifyLoginOtp(loginEmail, otp);
      messageApi.success("Login successful!");
      setDoorState("open");
      setTimeout(() => navigate("/screener", { replace: true }), 800);
    } catch (error: any) {
      setErrorMessage(
        error.response?.data?.detail ||
          error.message ||
          "OTP verification failed",
      );
      setShowErrorModal(true);
    } finally {
      setSpinning(false);
    }
  };

  const onSetConfirmForgotPasswordFinish = async (formData: any) => {
    setLocalSpinning(true);
    try {
      await setnewpassword(
        forgotPasswordEmail,
        String(formData.otp),
        formData.newPassword,
      );
      setPasswordDetailOkText("Go To Sign In");
      setShowPasswordDetailModal(true);
      form.resetFields();
    } catch (error: any) {
      setErrorMessage(
        error.response?.data?.error || error.message || "An error occurred.",
      );
      setShowErrorModal(true);
    } finally {
      setLocalSpinning(false);
    }
  };

  const inputHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (String(e.target.value).length >= e.target.maxLength) e.preventDefault();
  };

  const onFinishForgotPassword = async (formData: any) => {
    const email = formData.forgotPasswordEmail;
    setForgotPasswordEmail(email);
    setLocalSpinning(true);
    try {
      await otp(email);
      messageApi.success("OTP sent successfully!");
      setForgotPasswordFlow(false);
      setNewPasswordOTPFlow(true);
      formForgotPassword.resetFields();
    } catch (error: any) {
      setErrorMessage(
        error.response?.data?.message ||
          error.message ||
          "An error occurred while sending OTP.",
      );
      setShowErrorModal(true);
    } finally {
      setLocalSpinning(false);
    }
  };

  const backToLogin = () => {
    setForgotPasswordFlow(false);
    setNewPasswordOTPFlow(false);
    setLoginOtpFlow(false);
    formForgotConfirmNewPassword.resetFields();
    formForgotPassword.resetFields();
    form.resetFields();
  };

  const handlePasswordDetailOkClick = () => {
    if (forgotPasswordFlow) {
      setForgotPasswordFlow(false);
      setNewPasswordOTPFlow(true);
    } else if (newPasswordOTPFlow) {
      setForgotPasswordFlow(false);
      setNewPasswordOTPFlow(false);
    }
    formForgotConfirmNewPassword.resetFields();
    formForgotPassword.resetFields();
    setShowPasswordDetailModal(false);
  };

  const handleErrorModalClose = () => {
    setShowErrorModal(false);
    setErrorMessage("");
  };

  /* ════════════════════════════ RENDER ════════════════════════════ */
  return (
    <div className={`lc_wrap lc_door_${doorState}`}>
      {contextHolder}

      {/* Modals */}
      <Modal
        title="Error"
        open={showErrorModal}
        centered
        onOk={handleErrorModalClose}
        onCancel={handleErrorModalClose}
        footer={[
          <Button key="ok" type="primary" onClick={handleErrorModalClose}>
            OK
          </Button>,
        ]}
      >
        <p className="mb-4! text-white!">{errorMessage}</p>
      </Modal>
      <Modal />
      <Modal
        title="Session Expired"
        open={showSessionExpiredModal}
        centered
        onCancel={() => logout()}
        footer={[
          <Button key="cancel" onClick={() => logout()}>
            Cancel
          </Button>,
          <Button
            key="login"
            type="primary"
            onClick={async () => {
              await logout();
              navigate("/login", { replace: true });
            }}
          >
            Go to Login
          </Button>,
        ]}
      >
        <p className="mb-4! text-white!">
          {sessionExpiredMessage ||
            "Your session has expired. Please login again."}
        </p>
      </Modal>

      <SubmitModal isModalVisible={showPasswordDetailModal}>
        <PasswordDetailModal
          status={"Success"}
          message={"Password has been reset successfully."}
          handleOKButtonText={passwordDetailOkText}
          handlePasswordDetailOkClick={handlePasswordDetailOkClick}
        />
      </SubmitModal>

      {/* ══════════ LEFT PANEL ══════════ */}
      <div className="lc_left lc_door_panel_left">
        {/* ── Card ─────────────────────────────────── */}
        <div className="lc_card">
          <div style={{ padding: "20px 40px 0px 40px" }}>
            {/* Card header: logo + powered by */}
            <div className="lc_card_header">
              <img src={icalLogo} alt="ICAL" className="lc_card_logo" />
              <div className="lc_card_powered">
                <span className="lc_powered_text">Powered by</span>
                <img src={icalIndxxLogo} alt="indXX" className="lc_indxx_img" />
              </div>
            </div>

            {/* Form body */}
            {forgotPasswordFlow ? (
              <>
                <h2 className="lc_title">Forget Password</h2>
                <p className="lc_subtitle">
                  Enter your registered email address to receive OTP
                </p>
                <Form
                  className="lc_form login"
                  form={formForgotPassword}
                  layout="vertical"
                  name="registerForgotPassword"
                  onFinish={onFinishForgotPassword}
                  scrollToFirstError
                >
                  <Form.Item
                    name="forgotPasswordEmail"
                    label="Email ID"
                    className="login_lable MB0"
                    rules={[
                      { type: "email", message: "Invalid email" },
                      { required: true, message: "Required" },
                    ]}
                  >
                    <Input
                      className="login_input"
                      placeholder="Enter E-mail"
                      autoFocus
                    />
                  </Form.Item>
                  <Form.Item className="login_lable MB0">
                    <span onClick={backToLogin} className="login_form_forgot">
                      Back to Login
                    </span>
                  </Form.Item>
                  <Form.Item className="login_lable">
                    <Spin spinning={localSpinning} size="small">
                      <Button className="loginBtn" htmlType="submit">
                        Send OTP
                      </Button>
                    </Spin>
                  </Form.Item>
                </Form>
              </>
            ) : newPasswordOTPFlow ? (
              <>
                <h2 className="lc_title">Set New Password</h2>
                <p className="lc_subtitle">Enter OTP from your email address</p>
                <Form
                  className="lc_form login"
                  form={formForgotConfirmNewPassword}
                  layout="vertical"
                  name="registerNewPassword"
                  onFinish={onSetConfirmForgotPasswordFinish}
                >
                  <Form.Item
                    label="OTP"
                    name="otp"
                    className="login_lable MB0"
                    rules={[
                      { required: true, message: "OTP is required" },
                      { pattern: /^[0-9]+$/, message: "Numbers only" },
                    ]}
                  >
                    <Input
                      onChange={inputHandler}
                      maxLength={6}
                      min={0}
                      className="login_input"
                      autoFocus
                    />
                  </Form.Item>
                  <Form.Item
                    name="newPassword"
                    label="New Password"
                    className="login_lable MB0"
                    hasFeedback
                    rules={[
                      { required: true, message: "Required" },
                      { pattern: /(?=.{8,})/, message: "Min 8 characters" },
                      {
                        pattern: /(?=.*[a-z])/,
                        message: "At least 1 lowercase",
                      },
                      {
                        pattern: /(?=.*[A-Z])/,
                        message: "At least 1 uppercase",
                      },
                      { pattern: /(?=.*[0-9])/, message: "At least 1 number" },
                      {
                        pattern: /(?=.*[-_`~!@#$%^&*(){}+=\\';:"/?>.<,|\[\]])/,
                        message: "At least 1 special char",
                      },
                      ({ getFieldValue }) => ({
                        validator(_, val) {
                          if (!val || getFieldValue("oldPassword") !== val)
                            return Promise.resolve();
                          return Promise.reject(
                            new Error("Cannot reuse old password"),
                          );
                        },
                      }),
                    ]}
                  >
                    <Input.Password className="login_input" />
                  </Form.Item>
                  <Form.Item
                    name="confirmPassword"
                    label="Confirm Password"
                    dependencies={["newPassword"]}
                    className="login_lable MB0"
                    hasFeedback
                    rules={[
                      { required: true, message: "Required" },
                      ({ getFieldValue }) => ({
                        validator(_, val) {
                          if (!val || getFieldValue("newPassword") === val)
                            return Promise.resolve();
                          return Promise.reject(
                            new Error("Passwords do not match"),
                          );
                        },
                      }),
                    ]}
                  >
                    <Input.Password className="login_input" />
                  </Form.Item>
                  <Form.Item className="login_lable MB0">
                    <span onClick={backToLogin} className="login_form_forgot">
                      Back to Login
                    </span>
                  </Form.Item>
                  <Form.Item shouldUpdate className="login_lable">
                    <Spin spinning={localSpinning} size="small">
                      <Button className="loginBtn" htmlType="submit">
                        Confirm
                      </Button>
                    </Spin>
                  </Form.Item>
                </Form>
              </>
            ) : loginOtpFlow ? (
              <>
                <h2 className="lc_title">Verify OTP</h2>
                <p className="lc_subtitle">Enter OTP sent to {loginEmail}</p>
                <Form
                  className="lc_form login"
                  layout="vertical"
                  onFinish={onVerifyLoginOtp}
                >
                  <Form.Item
                    label="OTP"
                    name="otp"
                    className="login_lable MB0"
                    rules={[
                      { required: true, message: "OTP is required" },
                      { pattern: /^[0-9]+$/, message: "Numbers only" },
                    ]}
                  >
                    <Input
                      onChange={inputHandler}
                      maxLength={6}
                      className="login_input"
                      autoFocus
                    />
                  </Form.Item>
                  <Form.Item className="login_lable MB0">
                    <span onClick={backToLogin} className="login_form_forgot">
                      Back to E-mail
                    </span>
                  </Form.Item>
                  <Form.Item className="login_lable MT10">
                    <Spin spinning={isSpinning} size="small">
                      <Button className="loginBtn" htmlType="submit">
                        Verify & Login
                      </Button>
                    </Spin>
                  </Form.Item>
                </Form>
              </>
            ) : (
              <>
                <h2 className="lc_title">Login</h2>
                <Form
                  className="lc_form login"
                  form={form}
                  layout="vertical"
                  name="register"
                  onFinish={onFinish}
                  scrollToFirstError
                >
                  <Form.Item
                    name="email"
                    label="Email ID"
                    className="login_lable MB0"
                    rules={[
                      { type: "email", message: "Invalid email" },
                      { required: true, message: "Required" },
                    ]}
                  >
                    <Input
                      className="login_input"
                      placeholder="admin@indxx.com"
                    />
                  </Form.Item>

                  <Form.Item className="login_lable MB0">
                    <span className="login_form_forgot_first_txt">
                      Forgot password?{" "}
                      <a
                        onClick={() => setForgotPasswordFlow(true)}
                        className="login_form_forgot"
                      >
                        Contact Administrator
                      </a>
                    </span>
                  </Form.Item>
                  <Form.Item className="login_lable MT10">
                    <Spin spinning={isSpinning} size="small">
                      <Button className="loginBtn" htmlType="submit">
                        Get OTP
                      </Button>
                    </Spin>
                  </Form.Item>
                </Form>
              </>
            )}
          </div>
          {/* ── Footer inside card ──────────────────── */}
          <div className="lc_card_footer">
            <div className="lc_footer_links">
              <span>Privacy Policy</span>
              <span className="lc_dot">·</span>
              <span>Terms of Service</span>
              <span className="lc_dot">·</span>
              <span>Support</span>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════ RIGHT PANEL ══════════ */}
      <div className="lc_right lc_door_panel_right">
        {/* Gradient overlay (z-index 1) and bg image (::after) come from CSS */}
        <div className="lc_right_content">
          <div className="gradient_heading">
            <span>Welcome to</span>
            <div className="lc_right_header">
              <img src={icalLogo} alt="ICAL" className="lc_right_logo" />
            </div>
          </div>
          <div className="gradient_subheading">Thematic Classification Made Intelligent</div>
          <div className="gradient_text">
            <TextCarousel items={carouselItems} delay={3000} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginSignup;
