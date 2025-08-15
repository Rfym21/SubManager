import axios from 'axios'

const instance = axios.create({
  baseURL: 'http://localhost:8103',
  timeout: 1000 * 30
})

const login = async (username, password) => {
  try {
    const res = await instance.post('/login', {
      username,
      password
    })
    if (res.status == 200) {
      return res.data
    } else {
      return false
    }
  } catch (err) {
    return false
  }
}

const register = async (username, nickname, password) => {
  try {
    const res = await instance.post('/register', {
      username,
      nickname,
      password
    })
    if (res.status == 200) {
      return res.data
    } else {
      return false
    }
  } catch (err) {
    return false
  }
}

const getFiles = async (token) => {
  try {
    const res = await instance.get('/files?token=' + token)
    if (res.status == 200) {
      return res.data
    } else {
      return false
    }
  } catch (err) {
    return false
  }
}

export {
  login,
  register,
  getFiles
}