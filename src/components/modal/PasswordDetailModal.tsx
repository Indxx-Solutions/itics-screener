import { Button } from "antd";

interface HandlePasswordDetailModalProps {
  status: string;
  message: string;
  handleOKButtonText: string;
  handlePasswordDetailOkClick: () => void;
}

const HandlePasswordDetailModal: React.FC<HandlePasswordDetailModalProps> = ({
  status,
  message,
  handleOKButtonText,
  handlePasswordDetailOkClick,
}) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <h2 className="MB10">{status}</h2>
      <h3 className="MB20">{message}</h3>
      <Button type="primary" onClick={handlePasswordDetailOkClick}>
        {handleOKButtonText}
      </Button>
    </div>
  );
};

export default HandlePasswordDetailModal;