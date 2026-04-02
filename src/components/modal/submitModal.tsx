import { Modal } from "antd";

interface SubmitModalProps {
  isModalVisible: boolean;
  children: any;
  dualList?: boolean;
}

const SubmitModal: React.FC<SubmitModalProps> = ({ isModalVisible, children, dualList }) => {
  return (
    <Modal
      width={dualList ? "75%" : ""}
      style={{ maxWidth: "850px" }}
      closable={false}
      open={isModalVisible}
      centered
      footer={null}
    >
      {children}
    </Modal>
  );
};

export default SubmitModal;