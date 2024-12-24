export class VaultWorker {
  private worker: Worker

  constructor() {
    this.worker = new Worker(
      new URL('./worker.ts', import.meta.url),
      { type: 'module' }
    )
  }

  private async send(type: string, payload: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const handler = (message: MessageEvent) => {
        this.worker.removeEventListener('message', handler)
        if (message.data.type === 'error') {
          reject(new Error(message.data.error));
        } else {
          resolve(message.data.result)
        }
      }

      this.worker.addEventListener('message', handler)
      this.worker.postMessage({ type, payload })
    })
  }

  async createVault(vaultName: string, password: string, namespace: string, data: any, expiresInSeconds?: BigInt): Promise<void> {
    await this.send('create_vault', { vaultName, password, namespace, data, expiresInSeconds })
  }

  async readFromVault(vaultName: string, password: string, namespace: string, expiresInSeconds?: BigInt): Promise<any> {
    return this.send('read_from_vault', { vaultName, password, namespace, expiresInSeconds });
  }

  async upsertVault(vaultName: string, password: string, namespace: string, data: any, expiresInSeconds?: BigInt, replaceIfExists?: boolean): Promise<void> {
    await this.send('upsert_vault', { vaultName, password, namespace, data, expiresInSeconds, replaceIfExists })
  }

  async removeFromVault(vaultName: string, password: string, namespace: string): Promise<void> {
    await this.send('remove_from_vault', { vaultName, password, namespace })
  }

  async removeVault(vaultName: string, password: string): Promise<void> {
    await this.send('remove_vault', { vaultName, password })
  }

  async listNamespaces(vaultName: string, password: string): Promise<string[]> {
    return this.send('list_namespaces', { vaultName, password })
  }

  async setDebugMode(enabled: boolean): Promise<void> {
    await this.send('set_debug_mode', { enabled })
  }

  async listVaults(): Promise<string[]> {
    return this.send('list_vaults', {})
  }

  async exportVault(vaultName: string, password: string): Promise<Uint8Array> {
    const response = await this.send('export_vault', { vaultName, password });
    return response;
  }

  async importVault(vaultName: string, password: string, data: Uint8Array): Promise<void> {
    await this.send('import_vault', { vaultName, password, data });
  }

  async configureCleanup(intervalSeconds: number): Promise<void> {
    await this.send('configure_cleanup', { intervalSeconds });
  }
}
