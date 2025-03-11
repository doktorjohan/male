const SELECT_MATCH_BY_ID = `
  SELECT
    p.id,
    p.turniir,
    p.algushetk,
    p.lopphetk,
    valge.id AS valge_id,
    valge.eesnimi AS valge_eesnimi,
    valge.perenimi AS valge_perenimi,
    valge.klubi AS valge_klubi,
    must.id AS must_id,
    must.eesnimi AS must_eesnimi,
    must.perenimi AS must_perenimi,
    must.klubi AS must_klubi,
    CASE
      WHEN valge_tulemus = 2 THEN 'Valge'
      WHEN must_tulemus = 2 THEN 'Must'
      ELSE 'Viik'
    END AS voitja
FROM
    partiid p
LEFT JOIN (
    SELECT
        i.id,
        i.eesnimi,
        i.perenimi,
        k.nimi AS klubi
    FROM
        isikud i
    LEFT JOIN
        klubid k ON i.klubis = k.id
) valge ON valge.id = p.valge
LEFT JOIN (
    SELECT
        i.id,
        i.eesnimi,
        i.perenimi,
        k.nimi AS klubi
    FROM
        isikud i
    LEFT JOIN
        klubid k ON i.klubis = k.id
) must ON must.id = p.must
`;

function getAddOrUpdateQuery(isUpdate) {
    let query;
    if (isUpdate) {
        query = `
        UPDATE partiid
        SET valge = $2, must = $3, algushetk = $4, lopphetk = $5, valge_tulemus = $6, must_tulemus = $7
        WHERE id = $1
        `;
    } else {
        query = `
        INSERT INTO partiid (turniir, valge, must, algushetk, lopphetk, valge_tulemus, must_tulemus)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;
    }
    return query;
}

const SELECT_ONGOING_MATCHES = `
    SELECT * FROM partiid p
    WHERE lopphetk IS NULL
`;

const SELECT_ALL_LOCATIONS = `
        SELECT * FROM asulad a
`;

const SELECT_ALL_PLAYERS = `
      SELECT i.id, i.eesnimi, i.perenimi, k.nimi AS klubi, i.synniaeg, i.sugu, i.ranking FROM isikud i
        LEFT JOIN klubid k ON i.klubis = k.id
`;

const SELECT_PLAYER_BY_ID = `
      SELECT i.id, i.eesnimi, i.perenimi, k.nimi AS klubi, i.synniaeg, i.sugu, i.ranking FROM isikud i
        LEFT JOIN klubid k ON i.klubis = k.id
        WHERE i.id = $1
`;

const SELECT_ALL_PLAYERS_IN_CLUB = `
      SELECT i.id, i.eesnimi, i.perenimi, k.nimi AS klubi, i.synniaeg, i.sugu, i.ranking FROM isikud i
        LEFT JOIN KLUBID k ON i.klubis = k.id
        WHERE i.klubis = $1
`;

const SELECT_PLAYER_STATISTICS = `
    SELECT
    COUNT(*) AS match_count,
    SUM(
      CASE
        WHEN (p.valge = $1 AND p.valge_tulemus = 2)
          OR (p.must = $1 AND p.must_tulemus = 2)
        THEN 1 ELSE 0
      END
    ) AS win_count,
    SUM(
      CASE
        WHEN p.valge = $1 THEN 1 ELSE 0
      END
    ) AS white_match_count,
    SUM(
      CASE
        WHEN p.valge = $1 AND p.valge_tulemus = 2
        THEN 1 ELSE 0
      END
    ) AS white_win_count,
    SUM(
      CASE
        WHEN p.must = $1 THEN 1 ELSE 0
      END
    ) AS black_match_count,
    SUM(
      CASE
        WHEN p.must = $1 AND p.must_tulemus = 2
        THEN 1 ELSE 0
      END
    ) AS black_win_count,
    (SELECT (p.lopphetk - p.algushetk) AS duration FROM partiid p
     WHERE p.valge = $1 or p.must = $1
     ORDER by duration DESC
     LIMIT 1 ) AS longest_match
    FROM partiid p
    WHERE p.valge = $1
       OR p.must = $1;
`;

const SELECT_TOP_PLAYERS = `
        SELECT * FROM isikud
        WHERE ranking IS NOT NULL
        ORDER BY ranking DESC
        LIMIT $1
`;

const INSERT_PLAYER = `
        INSERT INTO isikud (eesnimi, perenimi, klubis, synniaeg, sugu, ranking)
        VALUES ($1, $2, $3, $4, $5, $6)
`;

const SELECT_ALL_TOURNAMENTS = `
  SELECT t.id, t.nimi, t.alguskuupaev, t.loppkuupaev, a.nimi AS toimumiskoht FROM turniirid t
  LEFT JOIN asulad a ON t.asula = a.id
  ORDER BY loppkuupaev DESC
`;

const SELECT_ONGOING_TOURNAMENTS = `
  SELECT t.id, t.nimi, t.alguskuupaev, t.loppkuupaev, a.nimi AS toimumiskoht FROM turniirid t
  LEFT JOIN asulad a ON t.asula = a.id
  WHERE loppkuupaev > CURRENT_DATE
`;

const SELECT_TOURNAMENT_BY_ID = `
  SELECT t.id, t.nimi, t.alguskuupaev, t.loppkuupaev, a.nimi AS toimumiskoht FROM turniirid t
  LEFT JOIN asulad a ON t.asula = a.id
  WHERE t.id = $1
`;

const INSERT_TOURNAMENT = `
  INSERT INTO turniirid (nimi, asula, alguskuupaev, loppkuupaev)
  VALUES ($1, $2, $3, $4)
  RETURNING id
`;

const SELECT_ALL_CLUBS = `
    SELECT k.*, COUNT(i.id) as members, ROUND(AVG(i.ranking), 1) as average_rating
    FROM klubid k
    LEFT JOIN isikud i ON k.id = i.klubis
    GROUP BY k.id
`;

const SELECT_CLUB_BY_ID = `
    SELECT k.nimi, a.nimi AS asukoht, f_klubisuurus($1) AS members, ROUND(AVG(i.ranking), 1) AS average_rating
    FROM klubid k
    LEFT JOIN isikud i ON k.id = i.klubis
    LEFT JOIN asulad a ON k.asula = a.id
    WHERE k.id = $1
    GROUP BY k.nimi, a.nimi
`;

const SELECT_TOP_CLUBS = `
    SELECT k.nimi, ROUND(AVG(i.ranking), 1) as average_rating
    FROM klubid k
    LEFT JOIN isikud i ON k.id = i.klubis
    GROUP BY k.nimi
    HAVING AVG(i.ranking) IS NOT NULL
    ORDER BY average_rating DESC
    LIMIT $1
`;

const INSERT_CLUB = `
    INSERT INTO klubid (nimi, asula)
    VALUES ($1, $2)
    RETURNING id
`;

module.exports = {
    SELECT_MATCH_BY_ID,
    getAddOrUpdateQuery,
    SELECT_ONGOING_MATCHES,
    SELECT_ALL_LOCATIONS,
    SELECT_ALL_PLAYERS,
    SELECT_PLAYER_BY_ID,
    SELECT_ALL_PLAYERS_IN_CLUB,
    SELECT_PLAYER_STATISTICS,
    SELECT_TOP_PLAYERS,
    INSERT_PLAYER,
    SELECT_ALL_TOURNAMENTS,
    SELECT_ONGOING_TOURNAMENTS,
    SELECT_TOURNAMENT_BY_ID,
    INSERT_TOURNAMENT,
    SELECT_ALL_CLUBS,
    SELECT_CLUB_BY_ID,
    SELECT_TOP_CLUBS,
    INSERT_CLUB,
};