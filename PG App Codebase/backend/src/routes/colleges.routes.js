import { Router } from 'express'
import { getColleges } from '../controllers/colleges.controller.js'

const router = Router()
router.get('/', getColleges)
export default router
