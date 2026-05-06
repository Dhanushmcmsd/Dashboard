export const validate = (schema, target = "body") => (req, res, next) => {
    const parsed = schema.safeParse(req[target]);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    req[target] = parsed.data;
    next();
};
