const {pool} = require("../database")

const getAllClubs = (req, res) => {
    console.log("IN - Get all clubs request")

    let query = `
    SELECT k.*, COUNT(i.id) as members, ROUND(AVG(i.ranking), 1) as average_rating
    FROM klubid k
    LEFT JOIN isikud i ON k.id = i.klubis
    GROUP BY k.id
  `
    pool.query(query, (err, results) => {
        if (err) {
            console.error(err)
            return res.status(500).send({
                message: "Error while reading all clubs",
                error: err
            })
        }

        console.log("OUT - Get all clubs result: " + JSON.stringify(results.rows))
        res.status(200).send(results.rows)
    })
}

const getClubById = (req, res) => {
    const id = parseInt(req.params.id)
    console.log(`IN - Get club(id=${id}) request`)

    let query = `
    SELECT k.nimi, a.nimi AS asukoht, f_klubisuurus($1) AS members, ROUND(AVG(i.ranking), 1) AS average_rating
    FROM klubid k
    LEFT JOIN isikud i ON k.id = i.klubis
    LEFT JOIN asulad a ON k.asula = a.id
    WHERE k.id = $1
    GROUP BY k.nimi, a.nimi
  `
    pool.query(query, [id], (err, results) => {
        if (err) {
            console.error(err)
            return res.status(500).send({
                message: "Error while reading club with id: " + id,
                error: err
            })
        }

        console.log(`OUT - Get club(id=${id}) result: ${JSON.stringify(results.rows[0])}`)
        res.status(200).send(results.rows[0])
    })
}

const getTopClubs = (req, res) => {
    const limit = parseInt(req.params.limit)
    console.log(`IN - Get top clubs (limit=${limit})`)

    let query = `
    SELECT k.nimi, ROUND(AVG(i.ranking), 1) as average_rating
    FROM klubid k
    LEFT JOIN isikud i ON k.id = i.klubis
    GROUP BY k.nimi
    HAVING AVG(i.ranking) IS NOT NULL
    ORDER BY average_rating DESC
    LIMIT $1
    `
    pool.query(query, [limit], (err, results) => {
        if (err) {
            console.error(err)
            return res.status(500).send({
                message: "Error while reading top clubs:",
                error: err
            })
        }
        console.log("OUT - Get top clubs" + JSON.stringify(results.rows))
        res.status(200).send(results.rows)
    })
}

const addClub = (req, res) => {
    console.log("IN - Add club request")

    const {name, location} = req.body
    console.log(`Add club: ${name}, ${location}`)

    let query = `
    INSERT INTO klubid (nimi, asula)
    VALUES ($1, $2)
    RETURNING id
  `

    pool.query(query, [name, location], (err, results) => {
        if (err) {
            console.error(err)
            return res.status(500).send({
                message: "Error while adding club",
                error: err
            })
        }

        console.log(`OUT - Add club result: ${JSON.stringify(results.rows[0])}`)
        res.status(200).send(results.rows[0])
    })
}

module.exports = { getAllClubs, getClubById, addClub, getTopClubs }
