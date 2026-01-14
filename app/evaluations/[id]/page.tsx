import EvaluationResult from "../../components/evaluation_result";

export default function EvaluationPage({ params }: { params: { id: string } }) {
    const evaluationId = parseInt(params.id, 10);

    return <EvaluationResult evaluationId={evaluationId} />;
}
