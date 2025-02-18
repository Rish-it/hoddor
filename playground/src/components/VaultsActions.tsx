import { Button, Form, Input, Modal, message } from 'antd';
import Upload, { RcFile } from 'antd/es/upload';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { actions } from './../store/app.actions';
import { appSelectors } from './../store/app.selectors';
import { VaultWorker } from './../vault';

const vaultWorker = new VaultWorker();

type FieldType = {
  vaultName?: string;
};

export const VaultsActions = () => {
  const dispatch = useDispatch();
  const selectedVault = useSelector(appSelectors.getSelectedVault);
  const [messageApi, contextHolder] = message.useMessage();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreation = async (value: FieldType) => {
    await vaultWorker.createVault(value.vaultName || 'default');
    dispatch(actions.setVaults(await vaultWorker.listVaults()));

    messageApi.success(`Vault ${value.vaultName} created.`);

    setIsModalOpen(false);
  };

  const handleExportVault = async () => {
    if (!selectedVault) {
      return;
    }

    try {
      const vaultData = await vaultWorker.exportVault(selectedVault);
      const blob = new Blob([vaultData], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'vault_backup.dat';
      a.click();
      URL.revokeObjectURL(url);

      messageApi.success(`Vault ${selectedVault} exported.`);
    } catch (error) {
      console.error('Failed to export vault:', error);
      messageApi.success(`Vault ${selectedVault} export failed.`);
    }
  };

  const importVault = async (file: RcFile) => {
    const vaultName = prompt('Vault name:');
    if (vaultName) {
      try {
        await vaultWorker.importVault(
          vaultName,
          new Uint8Array(await file.arrayBuffer()),
        );

        dispatch(actions.setVaults(await vaultWorker.listVaults()));
        
        messageApi.success(`Vault ${vaultName} imported.`);
      } catch (error) {
        messageApi.error(`Failed to import vault ${vaultName}: ${error}`);
      }
    }
    return 'done';
  };

  return (
    <>
      {contextHolder}
      <Upload action={importVault} name="file" fileList={[]}>
        <Button
          style={{
            width: '100%',
            marginBottom: 15,
          }}
        >
          Import Vault
        </Button>
      </Upload>
      <Button
        style={{
          marginBottom: 15,
        }}
        type="primary"
        block
        onClick={() => setIsModalOpen(true)}
      >
        Create vault
      </Button>
      <Modal
        title="Create vault"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={(_, { CancelBtn }) => (
          <>
            <CancelBtn />
            <Button form="createVault" htmlType="submit" type="primary">
              Submit
            </Button>
          </>
        )}
        okButtonProps={{ htmlType: 'submit' }}
      >
        <Form id="createVault" onFinish={handleCreation} layout="vertical">
          <Form.Item<FieldType>
            label="Vault name:"
            name="vaultName"
            rules={[
              {
                required: true,
                message: 'Please input your vault name!',
              },
            ]}
          >
            <Input style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
      <Button
        style={{
          width: '100%',
          marginBottom: 30,
        }}
        variant="outlined"
        disabled={!selectedVault}
        onClick={handleExportVault}
      >
        Export Vault
      </Button>
    </>
  );
};
