// Define a estrutura de dados global que vamos sincronizar de forma segura
export interface AppState {
  tasks: unknown[];
  meals: Record<string, unknown>;
  workouts: Record<string, unknown>;
  grades: unknown[];
  monthlyGoals: unknown[];
  workoutHistory: unknown[];
  transactions: unknown[];
  preferences: {
    username: string | null;
    university: string | null;
    course: string | null;
    age: string | null;
    weight: string | null;
    height: string | null;
    notifs: Record<string, unknown>;
  };
  lastUpdated: string;
}

const FOLDER_NAME = 'Student OS';
const FILE_NAME = 'current_state.json';
// ... o resto do código mantém-se intocável a partir daqui
class DriveSyncService {
  private accessToken: string | null = null;

  // 1. AUTENTICAÇÃO
  setToken(token: string) {
    this.accessToken = token;
  }

  isAuthenticated(): boolean {
    return this.accessToken !== null;
  }

  // Helper para chamadas à API da Google
  private async fetchGoogle(url: string, options: RequestInit = {}) {
    if (!this.accessToken) throw new Error("Não autenticado na Google.");
    
    const headers = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      if (response.status === 401) this.accessToken = null; // Token expirado
      throw new Error(`Google API Error: ${response.statusText}`);
    }
    return response;
  }

  // 2. GESTÃO DE PASTAS
  private async getOrCreateFolder(folderName: string, parentId?: string): Promise<string> {
    let query = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`;
    if (parentId) query += ` and '${parentId}' in parents`;

    const searchRes = await this.fetchGoogle(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}`);
    const searchData = await searchRes.json();

    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0].id; // Pasta já existe
    }

    // Criar nova pasta
    const createRes = await this.fetchGoogle('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      body: JSON.stringify({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentId ? [parentId] : undefined
      })
    });
    const createData = await createRes.json();
    return createData.id;
  }

  // 3. SINCRONIZAÇÃO DIÁRIA (LAST-WRITE-WINS)
  async syncToDrive(localState: AppState): Promise<void> {
    const folderId = await this.getOrCreateFolder(FOLDER_NAME);
    const query = `name='${FILE_NAME}' and '${folderId}' in parents and trashed=false`;
    
    const searchRes = await this.fetchGoogle(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}`);
    const searchData = await searchRes.json();

    const fileMetadata = {
      name: FILE_NAME,
      parents: [folderId]
    };

    const media = new Blob([JSON.stringify(localState)], { type: 'application/json' });

    if (searchData.files && searchData.files.length > 0) {
      // Atualizar ficheiro existente (Last-Write-Wins)
      const fileId = searchData.files[0].id;
      await this.fetchGoogle(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
        method: 'PATCH',
        body: media
      });
    } else {
      // Criar novo ficheiro usando a API de upload multipart
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(fileMetadata)], { type: 'application/json' }));
      form.append('file', media);

      await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.accessToken}` },
        body: form
      });
    }
  }

  async fetchFromDrive(): Promise<AppState | null> {
    const folderId = await this.getOrCreateFolder(FOLDER_NAME);
    const query = `name='${FILE_NAME}' and '${folderId}' in parents and trashed=false`;
    
    const searchRes = await this.fetchGoogle(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}`);
    const searchData = await searchRes.json();

    if (!searchData.files || searchData.files.length === 0) return null;

    const fileId = searchData.files[0].id;
    const fileRes = await this.fetchGoogle(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`);
    return await fileRes.json();
  }
// 5. APAGAR DADOS DA NUVEM (FORMATAR SISTEMA)
  async deleteDriveFile(): Promise<void> {
    try {
      // 1. Encontra a pasta principal
      const folderId = await this.getOrCreateFolder(FOLDER_NAME);
      
      // 2. Procura o ficheiro mestre lá dentro
      const query = `name='${FILE_NAME}' and '${folderId}' in parents and trashed=false`;
      const searchRes = await this.fetchGoogle(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}`);
      const searchData = await searchRes.json();

      // 3. Se ele existir, envia o comando de destruição
      if (searchData.files && searchData.files.length > 0) {
        const fileId = searchData.files[0].id;
        
        await this.fetchGoogle(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
          method: 'DELETE'
        });
        console.log("[DriveSync] Ficheiro mestre apagado com sucesso da nuvem.");
      } else {
        console.log("[DriveSync] Nenhum ficheiro encontrado no Drive para apagar.");
      }
    } catch (error) {
      console.error("[DriveSync] Erro crítico ao apagar ficheiro no Drive:", error);
      throw error;
    }
  }
  // 4. ARQUIVO SEMESTRAL E LIMPEZA
  // Usamos um Generic <T> para dizer ao TypeScript "pode ser qualquer tipo de dados estruturado"
  async archiveSemester<T>(semesterName: string, dataToArchive: T): Promise<void> {
    const mainFolderId = await this.getOrCreateFolder(FOLDER_NAME);
    const archiveFolderId = await this.getOrCreateFolder('Archive', mainFolderId);
    
    const archiveFileName = `archive_${semesterName.replace(/\s+/g, '_')}_${Date.now()}.json`;
    
    const fileMetadata = {
      name: archiveFileName,
      parents: [archiveFolderId]
    };

    const media = new Blob([JSON.stringify(dataToArchive)], { type: 'application/json' });
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(fileMetadata)], { type: 'application/json' }));
    form.append('file', media);

    await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.accessToken}` },
      body: form
    });
  }
}

export const driveSync = new DriveSyncService();