// app/services/cloud_code_runner_service.ts
import env from '#start/env'

type Judge0StatusId =
    | 1 // In Queue
    | 2 // Processing
    | 3 // Accepted
    | 4 // Wrong Answer
    | 5 // Time Limit Exceeded
    | 6 // Compilation Error
// ... другие

interface Judge0Submission {
    token: string
}

interface Judge0Result {
    token: string
    stdout: string | null
    stderr: string | null
    compile_output: string | null
    time: string | null
    memory: number | null
    status: {
        id: Judge0StatusId
        description: string
    }
}

export default class CloudCodeRunnerService {
    private readonly apiKey = env.get('JUDGE0_RAPIDAPI_KEY') as string
    private readonly baseUrl = env.get('JUDGE0_RAPIDAPI_URL') as string;
    private readonly host = env.get('JUDGE0_RAPIDAPI_HOST') as string;

    public async execute(code: string, languageId: number = 74) {
        const headers = {
            'Content-Type': 'application/json',
            'X-RapidAPI-Key': this.apiKey,
            'X-RapidAPI-Host': this.host,
        }

        try {
            // === 1. Создаём submission ===
            const submitResponse = await fetch(`${this.baseUrl}/submissions?base64_encoded=false&wait=false`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    source_code: code,
                    language_id: languageId,
                    stdin: '',
                    cpu_time_limit: 5,
                    memory_limit: 128000,
                }),
            })

            if (!submitResponse.ok) {
                throw new Error(`Submission failed: ${submitResponse.status}`)
            }

            const submission = (await submitResponse.json()) as Judge0Submission
            const token = submission.token

            // === 2. Поллинг результата ===
            for (let i = 0; i < 15; i++) {
                await new Promise((r) => setTimeout(r, 1000))

                const resultResponse = await fetch(
                    `${this.baseUrl}/submissions/${token}?base64_encoded=false&fields=*`,
                    { headers }
                )

                if (!resultResponse.ok) {
                    throw new Error(`Failed to fetch result: ${resultResponse.status}`)
                }

                const result = (await resultResponse.json()) as Judge0Result

                if (result.status.id > 2) {
                    // Готово: либо успех, либо ошибка
                    const output = (result.stdout || '').trim()
                    const error = result.stderr || result.compile_output || null

                    return {
                        success: result.status.id === 3,
                        output,
                        console: output, // для JS/TS console.log → stdout
                        error: error?.trim() || null,
                        time: result.time,
                        memory: result.memory,
                    }
                }
            }

            throw new Error('Request timeot')
        } catch (error) {
            return {
                success: false,
                output: '',
                console: '',
                error: error instanceof Error ? error.message : 'Unknown error',
            }
        }
    }
}