import axios from 'axios';

const instance = axios.create({
    baseURL: 'http://localhost:8103',
    timeout: 1000 * 30
});

/**
 * 获取 Authorization 请求头
 * @returns {Object} headers
 */
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        Authorization: `Bearer ${token}`
    };
};

/**
 * 用户登录
 * @param {string} username
 * @param {string} password
 */
export const login = async (username, password) => {
    try {
        const res = await instance.post('/login', { username, password });
        return res.data;
    } catch (err) {
        return { status: false, message: err.message };
    }
};

/**
 * 获取所有配置
 */
export const getConfig = async () => {
    try {
        const res = await instance.get('/config', { headers: getAuthHeaders() });
        return res.data;
    } catch (err) {
        return { status: false, message: err.message };
    }
};

/**
 * 修改基础配置
 * @param {Object} data - { host, subconverter, filename, exclude, sub_config }
 */
export const updateConfig = async (data) => {
    try {
        const res = await instance.patch('/config', data, { headers: getAuthHeaders() });
        return res.data;
    } catch (err) {
        return { status: false, message: err.message };
    }
};

/**
 * 获取订阅链接列表
 */
export const getSubLinks = async () => {
    try {
        const res = await instance.get('/config/sub_links', { headers: getAuthHeaders() });
        return res.data;
    } catch (err) {
        return { status: false, message: err.message };
    }
};

/**
 * 添加订阅链接
 * @param {Object} data - { url, weight, filename }
 */
export const addSubLink = async (data) => {
    try {
        const res = await instance.post('/config/sub_links', data, { headers: getAuthHeaders() });
        return res.data;
    } catch (err) {
        return { status: false, message: err.message };
    }
};

/**
 * 修改订阅链接
 * @param {string} filename - 目标 filename
 * @param {Object} data - { url, weight, filename }
 */
export const updateSubLink = async (filename, data) => {
    try {
        const res = await instance.patch(`/config/sub_links/${filename}`, data, { headers: getAuthHeaders() });
        return res.data;
    } catch (err) {
        return { status: false, message: err.message };
    }
};

/**
 * 删除订阅链接
 * @param {string} filename
 */
export const deleteSubLink = async (filename) => {
    try {
        const res = await instance.delete(`/config/sub_links/${filename}`, { headers: getAuthHeaders() });
        return res.data;
    } catch (err) {
        return { status: false, message: err.message };
    }
};

/**
 * 获取订阅文件内容
 * @param {string} filename
 */
export const getFileContent = async (filename) => {
    try {
        const res = await instance.get(`/config/files/${filename}`, { headers: getAuthHeaders() });
        return res.data;
    } catch (err) {
        return { status: false, message: err.message };
    }
};

/**
 * 修改订阅文件内容
 * @param {string} filename
 * @param {string} content
 */
export const updateFileContent = async (filename, content) => {
    try {
        const res = await instance.put(`/config/files/${filename}`, { content }, { headers: getAuthHeaders() });
        return res.data;
    } catch (err) {
        return { status: false, message: err.message };
    }
};

/**
 * 删除订阅文件
 * @param {string} filename
 */
export const deleteFile = async (filename) => {
    try {
        const res = await instance.delete(`/config/files/${filename}`, { headers: getAuthHeaders() });
        return res.data;
    } catch (err) {
        return { status: false, message: err.message };
    }
};

/**
 * 获取订阅链接信息
 */
export const getSubInfo = async () => {
    try {
        const res = await instance.get('/sub/info', { headers: getAuthHeaders() });
        return res.data;
    } catch (err) {
        return { status: false, message: err.message };
    }
};
