import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, CreateAxiosDefaults } from 'axios';
import axiosRetry, { isNetworkOrIdempotentRequestError, isRetryableError } from 'axios-retry';
import { appLogger } from './logger';

export class HttpUtil {
  private logger = appLogger('common/http-util').createChild();
  private readonly client: AxiosInstance;

  constructor(defaultConfig: CreateAxiosDefaults) {
    this.client = axios.create(defaultConfig);
    axiosRetry(this.client, {
      retries: 2,
      retryDelay: (retryCount: number, error): number => {
        if (isRetryableError(error)) {
          const retry_after: number = error?.response?.headers['retry-after'] as number;
          if (retry_after > 0) {
            this.logger.info(`Retrying after ${retry_after} seconds`);
            return retry_after * 1000;
          }
        }
        return axiosRetry.exponentialDelay(retryCount, error);
      },
      retryCondition: (error) => {
        return isRetryableError(error) || isNetworkOrIdempotentRequestError(error);
      },
      shouldResetTimeout: true
    });
  }

  public async request(
    requestConfig: AxiosRequestConfig
  ): Promise<{ statusCode: number; body: object | string }> {
    try {
      const { status, data } = await this.client(requestConfig);

      return {
        statusCode: status,
        body: data
      };
    } catch (ex) {
      const axiosErr = ex as AxiosError;
      const errorData = {
        message: 'HTTP request failed',
        params: {
          statusCode: axiosErr?.response?.status,
          body: axiosErr?.response?.data
        },
        ex
      };
      return Promise.reject(errorData);
    }
  }
}
