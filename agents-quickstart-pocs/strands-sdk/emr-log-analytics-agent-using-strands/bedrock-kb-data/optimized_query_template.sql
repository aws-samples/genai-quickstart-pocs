WITH relevant_issues AS (
    SELECT issue_id, component, summary, description, knowledge_center_links, keywords
    FROM {known_issues_table}
    WHERE component IN ('{component_filter}')
),
pattern_matches AS (
    SELECT 
        ri.issue_id,
        ri.component,
        ri.summary,
        emr.data,
        -- Smart pattern matching based on active components with broader patterns
        CASE 
            WHEN ri.component = 'Spark' AND (
                strpos(lower(emr.data), 'error') > 0 OR
                strpos(lower(emr.data), 'exception') > 0 OR
                strpos(lower(emr.data), 'fail') > 0 OR
                strpos(lower(emr.data), 'killed') > 0 OR
                strpos(lower(emr.data), 'memory') > 0 OR
                strpos(lower(emr.data), 'sparkexception') > 0 OR
                strpos(lower(emr.data), 'fetchfailedexception') > 0 OR
                strpos(lower(emr.data), 'analysisexception') > 0 OR
                strpos(lower(emr.data), 'pythonexception') > 0
            ) THEN 'Spark Error'
            WHEN ri.component = 'YARN' AND (
                strpos(lower(emr.data), 'error') > 0 OR
                strpos(lower(emr.data), 'exception') > 0 OR
                strpos(lower(emr.data), 'fail') > 0 OR
                strpos(lower(emr.data), 'killed') > 0 OR
                strpos(lower(emr.data), 'memory') > 0 OR
                strpos(lower(emr.data), 'container killed') > 0 OR
                strpos(lower(emr.data), 'exit code') > 0
            ) THEN 'YARN Error'
            WHEN ri.component = 'HBase' AND (
                strpos(lower(emr.data), 'error') > 0 OR
                strpos(lower(emr.data), 'exception') > 0 OR
                strpos(lower(emr.data), 'fail') > 0 OR
                strpos(lower(emr.data), 'retriesexhaustedException') > 0 OR
                strpos(lower(emr.data), 'pleaseholdexception') > 0
            ) THEN 'HBase Error'
            WHEN ri.component = 'Hadoop' AND (
                strpos(lower(emr.data), 'error') > 0 OR
                strpos(lower(emr.data), 'exception') > 0 OR
                strpos(lower(emr.data), 'fail') > 0
            ) THEN 'Hadoop Error'
            ELSE NULL
        END as matched_pattern
    FROM relevant_issues ri
    CROSS JOIN {logs_table_name} emr
    WHERE (
        (ri.component = 'Spark' AND (
            strpos(lower(emr.data), 'spark') > 0 OR
            strpos(lower(emr.data), 'error') > 0 OR
            strpos(lower(emr.data), 'exception') > 0 OR
            strpos(lower(emr.data), 'fail') > 0 OR
            strpos(lower(emr.data), 'killed') > 0 OR
            strpos(lower(emr.data), 'memory') > 0
        )) OR
        (ri.component = 'YARN' AND (
            strpos(lower(emr.data), 'yarn') > 0 OR
            strpos(lower(emr.data), 'container') > 0 OR
            strpos(lower(emr.data), 'error') > 0 OR
            strpos(lower(emr.data), 'exception') > 0 OR
            strpos(lower(emr.data), 'fail') > 0 OR
            strpos(lower(emr.data), 'killed') > 0 OR
            strpos(lower(emr.data), 'memory') > 0
        )) OR
        (ri.component = 'HBase' AND (
            strpos(lower(emr.data), 'hbase') > 0 OR
            strpos(lower(emr.data), 'error') > 0 OR
            strpos(lower(emr.data), 'exception') > 0
        )) OR
        (ri.component = 'Hadoop' AND (
            strpos(lower(emr.data), 'hadoop') > 0 OR
            strpos(lower(emr.data), 'error') > 0 OR
            strpos(lower(emr.data), 'exception') > 0
        ))
    )
)
SELECT 
    issue_id,
    component,
    matched_pattern as matched_keyword,
    substr(data, 1, 200) as data,
    '' as filepath
FROM pattern_matches
WHERE matched_pattern IS NOT NULL
LIMIT 200