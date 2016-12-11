SELECT
	a.`name`,
	p.parent_id,
p.count
FROM
	attribute_name a,
	(
		SELECT
			t.parent_id,
			count(1) AS count
		FROM
			attribute_value t
		GROUP BY
			t.parent_id
	) p
WHERE
	p.parent_id = a.id;