const bcrypt = require('bcryptjs')
const { PrismaClient } = require('@prisma/client')
const generateToken = require('../utils/generateToken')
const { parseArgs } = require('node:util')

const prisma = new PrismaClient()

const register = async (req, res) => {
    const {name, email, password, role} = req.body

    try{
        const existingUser = await prisma.user.findUnique({ where: { email } })
        if (existingUser) {
            return res.status(400).json({message: 'Email already in use'})
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            role: role || 'STUDENT',
        },
    })

    res.status(201).json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user.id, user,role),
    })
} catch (error) {
    res.status(500).json({message: 'Server error', error: error.message})
    }
}

const login = async (req, res) => {
    const {email, password} = req.body 

    try{
        const user = await prisma.user.findUnique({ where: { email } })
        if (!user) {
            return res.status(401).json({message: 'Invalid email or password'})
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
        return res.status(401).json({message: 'Invalid email or password'})
    }

    res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user.id, user.role),
    })
} catch (error) {
    res.status(500).json({message: 'Server error', error: error.message})
    }
}

module.exports = { register, login }