// GitHub Gist 同步工具

export interface SyncResult {
  success: boolean;
  error?: string;
  gistId?: string;
  data?: any;
}

const GITHUB_API_BASE = 'https://api.github.com';
const GIST_FILENAME = 'workbench-data.json';
const GIST_DESCRIPTION = 'Daily Review Workbench Data';

// 验证 Token 有效性
export async function validateToken(token: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${GITHUB_API_BASE}/user`, {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (response.status === 401) {
      return { success: false, error: 'Token 无效或已过期' };
    }
    if (response.status === 403) {
      return { success: false, error: 'API 限流，请稍后重试' };
    }
    if (!response.ok) {
      return { success: false, error: `验证失败: ${response.status}` };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: '网络错误，请检查网络连接' };
  }
}

// 创建私有 Gist
export async function createGist(
  token: string,
  data: object
): Promise<{ success: boolean; error?: string; gistId?: string }> {
  try {
    const response = await fetch(`${GITHUB_API_BASE}/gists`, {
      method: 'POST',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description: GIST_DESCRIPTION,
        public: false,
        files: {
          [GIST_FILENAME]: {
            content: JSON.stringify(data, null, 2),
          },
        },
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        return { success: false, error: 'Token 无效' };
      }
      if (response.status === 403) {
        return { success: false, error: 'API 限流' };
      }
      return { success: false, error: `创建失败: ${response.status}` };
    }

    const result = await response.json();
    return { success: true, gistId: result.id };
  } catch (err) {
    return { success: false, error: '网络错误' };
  }
}

// 更新 Gist
export async function updateGist(
  token: string,
  gistId: string,
  data: object
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${GITHUB_API_BASE}/gists/${gistId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files: {
          [GIST_FILENAME]: {
            content: JSON.stringify(data, null, 2),
          },
        },
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        return { success: false, error: 'Token 无效' };
      }
      if (response.status === 404) {
        return { success: false, error: 'Gist 不存在' };
      }
      if (response.status === 403) {
        return { success: false, error: 'API 限流' };
      }
      return { success: false, error: `更新失败: ${response.status}` };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: '网络错误' };
  }
}

// 从 Gist raw URL 获取数据
export async function fetchGist(
  gistId: string
): Promise<{ success: boolean; error?: string; data?: any }> {
  try {
    const response = await fetch(
      `https://gist.githubusercontent.com/${gistId}/raw/${GIST_FILENAME}`,
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return { success: false, error: 'Gist 不存在' };
      }
      return { success: false, error: `获取失败: ${response.status}` };
    }

    const content = await response.text();
    const data = JSON.parse(content);
    return { success: true, data };
  } catch (err) {
    if (err instanceof SyntaxError) {
      return { success: false, error: '数据格式错误' };
    }
    return { success: false, error: '网络错误' };
  }
}

// 获取 Gist 信息
export async function getGistInfo(
  token: string,
  gistId: string
): Promise<{
  success: boolean;
  error?: string;
  updatedAt?: string;
  fileSize?: number;
}> {
  try {
    const response = await fetch(`${GITHUB_API_BASE}/gists/${gistId}`, {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        return { success: false, error: 'Token 无效' };
      }
      if (response.status === 404) {
        return { success: false, error: 'Gist 不存在' };
      }
      if (response.status === 403) {
        return { success: false, error: 'API 限流' };
      }
      return { success: false, error: `获取信息失败: ${response.status}` };
    }

    const result = await response.json();
    const file = result.files[GIST_FILENAME];

    return {
      success: true,
      updatedAt: result.updated_at,
      fileSize: file?.size || 0,
    };
  } catch (err) {
    return { success: false, error: '网络错误' };
  }
}
