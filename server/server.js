require('dotenv').config({})
const express = require('express')
const { Sequelize, DataTypes } = require('sequelize');
const cors = require('cors');
const Op = Sequelize.Op
const path = require('path')


let sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'examen.db'
})

const Ship = sequelize.define('ship', {
    shipID: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: Sequelize.STRING,
        validate: {
            isLengthGreaterThan(value) {
                if (value.length < 3) {
                    throw new Error("Length too short")
                }
            }
        }
    },
    displacement: { 
        type: Sequelize.INTEGER,
        validate: {
            min: 50
        }
    }
}, {
    freezeTableName: true,
    timestamps: false,
    createdAt: false,

});

const Crewmember = sequelize.define('crewmember ', {
    crewMemberID: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: Sequelize.STRING,
        validate: {
            isLengthGreaterThan(value) {
                if (value.length < 5) {
                    throw new Error("Length too short")
                }
            }
        }
    },
    role: {
        type: Sequelize.ENUM,
        values: ['CAPTAIN', 'BOATSWAIN']
    },
    shipID: Sequelize.INTEGER,
}, {
    freezeTableName: true,
    timestamps: false,
    createdAt: false,

});

Ship.hasMany(Crewmember, { foreignKey: 'shipID' });

// async function checkIfExists() {
//     try {
//         await Ship.sync({ force: true });
//         await Crewmember.sync({ force: true });

//     } catch (error) {
//         console.error(error.message)
//     }
// }

// checkIfExists()


const app = express()
app.use(cors()) //node module for allowing data transfer from frontend to backend
app.use(express.json());


// sync method
app.get('/sync', async (req, res) => {
    try {
      await sequelize.sync({ force: true })
      res.status(201).json({ message: 'created' })
    } catch (e) {
      console.warn(e)
      res.status(500).json({ message: 'server error' })
    }
})

app.get('/ships', async (req, res) => {
    try {
        const query = {}
        let pageSize = 2
        const allowedFilters = ['name', 'displacement']
        const filterKeys = Object.keys(req.query).filter(e => allowedFilters.indexOf(e) !== -1)
        if (filterKeys.length > 0) {
            query.where = {}
            for (const key of filterKeys) {
                if (key == 'displacement') {
                    query.where[key] = parseInt(req.query[key])
                    console.log('aaaaa');
                } else {
                    query.where[key] = {
                        [Op.like]: `%${req.query[key]}%`
                    }
                }
            }
        }

        const sortField = req.query.sortField
        let sortOrder = 'ASC'
        if (req.query.sortOrder && req.query.sortOrder === '-1') {
            sortOrder = 'DESC'
        }

        if (req.query.pageSize) {
            pageSize = parseInt(req.query.pageSize)
        }

        if (sortField) {
            query.order = [[sortField, sortOrder]]
        }

        if (!isNaN(parseInt(req.query.page))) {
            query.limit = pageSize
            query.offset = pageSize * parseInt(req.query.page)
        }

        const records = await Ship.findAll(query)
        console.log(query);
        console.log(records);
        const count = await Ship.count()
        if (records.length == 0) {
            res.status(200).json({ message: 'no recoreds found' })
        } else {
            res.status(200).json({ records, count })
        }
    } catch (e) {
        console.warn(e)
        res.status(500).json({ message: 'server error' })
    }
})

// SELECT SHIP WITH ID
app.get('/ship/:id', async (req, res) => {
    try {
        let ship = await Ship.findByPk(req.params.id)
        if (ship) {
            res.status(200).json(ship)
        }
        else {
            res.status(404).json({ message: 'not found' })
        }
    }
    catch (e) {
        console.warn(e)
        res.status(500).json({ message: 'server error' })
    }
})


// INSERT
app.post('/ships', async (req, res) => {
    try {
        let name = req.body.name
        console.log('name: '+ name)
        let displacement = req.body.displacement
        if (name.length >= 5 && displacement > 50) {
            await Ship.create(req.body)
            res.status(201).json({ message: 'Ship created successfully!' })
        }
        else {
            res.status(400).json({ message: 'Ship not created!' })
        }
    }
    catch (e) {
        console.warn(e)
        res.status(500).json({ message: 'server error' })
    }
})

// UPDATE
app.put('/ships/:id', async (req, res) => {
    try {
        let ship = await Ship.findByPk(req.params.id)
        if (ship) {
            await ship.update(req.body)
            res.status(202).json({ message: 'accepted' })
        }
        else {
            res.status(404).json({ message: 'not found' })
        }
    }
    catch (e) {
        console.warn(e)
        res.status(500).json({ message: 'server error' })
    }
})

// DELETE
app.delete('/ships/:id', async (req, res) => {
    try {
        let ship = await Ship.findByPk(req.params.id)

        if (ship) {
            await ship.destroy()
            res.status(202).json({ message: 'accepted' })
            console.log('ship deleted');
        }
        else {
            res.status(404).json({ message: 'not found' })
        }
    }
    catch (e) {
        console.warn(e)
        res.status(500).json({ message: 'server error' })
    }
})

// =========== CREWMEMBER
// SELECT ALL CREWMEMBERS BASED ON SHIPID
app.get('/ships/:sid/crewmembers', async (req, res) => {
    try {
        let ship = await Ship.findByPk(req.params.sid)
        if (ship) {
            let crewmembers = await Crewmember.findAll({
                where: { shipID: req.params.sid }
            })
            res.status(200).json(crewmembers)
        }
        else {
            res.status(404).json({ message: 'not found' })
        }
    }
    catch (e) {
        console.warn(e)
        res.status(500).json({ message: 'server error' })
    }
})

// SELECT CREWMEMBERS BASED ON ID SHIP AND CREWMEMBER ID
app.get('/ships/:sid/crewmembers/:cid', async (req, res) => {
    try {
        let ship = await Ship.findByPk(req.params.sid)
        if (ship) {
            let crewmembers = await Crewmember.findAll({
                where: {
                    crewMemberID: req.params.cid,
                    shipID: req.params.sid
                }
            })
            res.status(200).json(crewmembers.shift())
        }
        else {
            res.status(404).json({ message: 'not found' })
        }
    }
    catch (e) {
        console.warn(e)
        res.status(500).json({ message: 'server error' })
    }
})

// INSERT CREWMEMBERS BASED ON ID SHIP
app.post('/ships/:sid/crewmembers', async (req, res) => {
    try {
        let ship = await Ship.findByPk(req.params.sid)
        if (ship) {
            let crewmember = req.body
            crewmember.shipID = ship.shipID
            if (crewmember.role == 'CAPTAIN' || crewmember.role == 'BOATSWAIN') {
                await Crewmember.create(crewmember)
                res.status(201).json({ message: 'created' })
            } else {
                res.status(404).json({ message: 'incorrect role' })
            }
        }
        else {
            res.status(404).json({ message: 'not found' })
        }

    }
    catch (e) {
        console.warn(e)
        res.status(500).json({ message: 'server error' })
    }
})

// UPDATE CREWMEMBER BASED ON ID SHIP AND CREWMEMBER ID
app.put('/ships/:sid/crewmembers/:cid', async (req, res) => {
    try {
        let ship = await Ship.findByPk(req.params.sid)
        if (ship) {
            let crewmembers = await Crewmember.findAll({
                where: {
                    crewMemberID: req.params.cid,
                    shipID: req.params.sid
                }
            })
            let crewmember = crewmembers.shift()
            if (crewmember) {
                await crewmember.update(req.body)
                res.status(202).json({ message: 'accepted' })
            }
            else {
                res.status(404).json({ message: 'not found' })
            }
        }
        else {
            res.status(404).json({ message: 'not found' })
        }
    }
    catch (e) {
        console.warn(e)
        res.status(500).json({ message: 'server error' })
    }
})

// DELETE REFERENCE BASED ON ID ARTICLE AND REFERENCE ID
app.delete('/ships/:sid/crewmembers/:cid', async (req, res) => {
    try {
        let ship = await Ship.findByPk(req.params.sid)
        if (ship) {
            let crewmembers = await Crewmember.findAll({
                where: {
                    crewMemberID: req.params.cid,
                    shipID: req.params.sid
                }
            })
            let crewmember = crewmembers.shift()
            if (crewmember) {
                await crewmember.destroy(req.body)
                res.status(202).json({ message: 'accepted' })
            }
            else {
                res.status(404).json({ message: 'not found' })
            }
        }
        else {
            res.status(404).json({ message: 'not found' })
        }
    }
    catch (e) {
        console.warn(e)
        res.status(500).json({ message: 'server error' })
    }
})

app.listen(3030)