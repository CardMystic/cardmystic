import { ref } from 'vue';
import type { PageInfo } from '~/models/pageInfoModel';

const pageInfo = ref<PageInfo>();

export const usePageInfo = () => {
  const setPageInfo = (info: PageInfo) => {
    pageInfo.value = info;
  };

  const getPageInfo = () => pageInfo.value;

  return {
    pageInfo: readonly(pageInfo),
    setPageInfo,
    getPageInfo,
  };
};
