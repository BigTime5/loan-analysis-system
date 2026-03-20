import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({ baseURL: API_BASE })

export const scoreApplicant = (data) => api.post('/score', data)

export const scoreBatch = (file) => {
  const form = new FormData()
  form.append('file', file)
  return api.post('/score/batch', form, {
    responseType: 'blob',
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const getModelCard = () => api.get('/model/card')
export const getHealth    = () => api.get('/health')
